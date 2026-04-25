package com.uniondesk.auth.core;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.uniondesk.common.web.ApiResponse;
import com.uniondesk.iam.core.IamService;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.util.List;
import java.util.Locale;
import java.util.Optional;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;
import org.springframework.util.StringUtils;

@Component
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    private static final String BEARER_PREFIX = "Bearer ";
    private static final List<String> PUBLIC_PATHS = List.of(
            "/api/v1/health",
            "/api/v1/auth/login",
            "/actuator/health",
            "/error");

    private final JwtTokenService jwtTokenService;
    private final LoginSessionService loginSessionService;
    private final IamService iamService;
    private final ObjectMapper objectMapper;

    public JwtAuthenticationFilter(
            JwtTokenService jwtTokenService,
            LoginSessionService loginSessionService,
            IamService iamService,
            ObjectMapper objectMapper) {
        this.jwtTokenService = jwtTokenService;
        this.loginSessionService = loginSessionService;
        this.iamService = iamService;
        this.objectMapper = objectMapper;
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
            throws ServletException, IOException {
        try {
            UserContextHolder.clear();
            SecurityContextHolder.clearContext();
            if (PUBLIC_PATHS.contains(request.getRequestURI()) || "OPTIONS".equalsIgnoreCase(request.getMethod())) {
                filterChain.doFilter(request, response);
                return;
            }
            String clientCodeHeader = request.getHeader(AuthClientHeaders.CLIENT_CODE_HEADER);
            if (!StringUtils.hasText(clientCodeHeader)) {
                writeUnauthorized(response, "missing client code");
                return;
            }
            Optional<String> token = resolveToken(request);
            token.ifPresent(value -> {
                try {
                    UserContext userContext = jwtTokenService.parseAccessToken(value);
                    if (!clientCodeHeader.equalsIgnoreCase(userContext.clientCode())) {
                        throw new IllegalArgumentException("client mismatch");
                    }
                    if (loginSessionService.validateAndTouch(userContext.sessionId(), clientCodeHeader)) {
                        if (!iamService.isApiAllowed(userContext, request.getMethod(), request.getRequestURI())) {
                            throw new SecurityException("forbidden");
                        }
                        UserContextHolder.set(userContext);
                        UsernamePasswordAuthenticationToken authentication = new UsernamePasswordAuthenticationToken(
                                userContext,
                                value,
                                List.of(new SimpleGrantedAuthority("ROLE_" + userContext.role().toUpperCase(Locale.ROOT))));
                        authentication.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));
                        SecurityContextHolder.getContext().setAuthentication(authentication);
                    }
                } catch (SecurityException ex) {
                    UserContextHolder.clear();
                    SecurityContextHolder.clearContext();
                    throw ex;
                } catch (IllegalArgumentException ignored) {
                    UserContextHolder.clear();
                    SecurityContextHolder.clearContext();
                }
            });
            if (response.isCommitted()) {
                return;
            }
            if (SecurityContextHolder.getContext().getAuthentication() == null
                    && token.isPresent()) {
                writeUnauthorized(response, "unauthorized");
                return;
            }
            filterChain.doFilter(request, response);
        } catch (SecurityException ex) {
            writeForbidden(response);
        } finally {
            UserContextHolder.clear();
            SecurityContextHolder.clearContext();
        }
    }

    private Optional<String> resolveToken(HttpServletRequest request) {
        String header = request.getHeader(HttpHeaders.AUTHORIZATION);
        if (!StringUtils.hasText(header) || !header.startsWith(BEARER_PREFIX)) {
            return Optional.empty();
        }
        String token = header.substring(BEARER_PREFIX.length()).trim();
        return token.isEmpty() ? Optional.empty() : Optional.of(token);
    }

    private void writeUnauthorized(HttpServletResponse response, String message) throws IOException {
        response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
        response.setContentType(MediaType.APPLICATION_JSON_VALUE);
        objectMapper.writeValue(response.getWriter(), ApiResponse.error("UNAUTHORIZED", message));
    }

    private void writeForbidden(HttpServletResponse response) throws IOException {
        response.setStatus(HttpServletResponse.SC_FORBIDDEN);
        response.setContentType(MediaType.APPLICATION_JSON_VALUE);
        objectMapper.writeValue(response.getWriter(), ApiResponse.error("FORBIDDEN", "forbidden"));
    }
}
