package com.uniondesk.auth.core;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.util.List;
import java.util.Locale;
import java.util.Optional;
import org.springframework.http.HttpHeaders;
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

    public JwtAuthenticationFilter(JwtTokenService jwtTokenService, LoginSessionService loginSessionService) {
        this.jwtTokenService = jwtTokenService;
        this.loginSessionService = loginSessionService;
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
            resolveToken(request).ifPresent(token -> {
                try {
                    UserContext userContext = jwtTokenService.parseAccessToken(token);
                    if (loginSessionService.validateAndTouch(userContext.sessionId())) {
                        UserContextHolder.set(userContext);
                        UsernamePasswordAuthenticationToken authentication = new UsernamePasswordAuthenticationToken(
                                userContext,
                                token,
                                List.of(new SimpleGrantedAuthority("ROLE_" + userContext.role().toUpperCase(Locale.ROOT))));
                        authentication.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));
                        SecurityContextHolder.getContext().setAuthentication(authentication);
                    }
                } catch (IllegalArgumentException ignored) {
                    UserContextHolder.clear();
                    SecurityContextHolder.clearContext();
                }
            });
            filterChain.doFilter(request, response);
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
}
