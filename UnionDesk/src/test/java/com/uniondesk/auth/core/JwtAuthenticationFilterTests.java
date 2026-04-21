package com.uniondesk.auth.core;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

import com.fasterxml.jackson.databind.ObjectMapper;
import java.io.IOException;
import java.time.Duration;
import java.util.concurrent.atomic.AtomicReference;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;

class JwtAuthenticationFilterTests {

    private static final String SECRET = "uniondesk-demo-jwt-secret-please-change-me";

    private final JwtTokenService jwtTokenService = new JwtTokenService(
            new ObjectMapper(),
            SECRET,
            "uniondesk",
            Duration.ofHours(24),
            Duration.ofDays(7));

    private final LoginSessionService loginSessionService = mock(LoginSessionService.class);
    private final JwtAuthenticationFilter filter = new JwtAuthenticationFilter(jwtTokenService, loginSessionService);

    @AfterEach
    void cleanup() {
        UserContextHolder.clear();
        SecurityContextHolder.clearContext();
    }

    @Test
    void populatesUserContextAndAuthenticationForBearerToken() throws ServletException, IOException {
        UserContext expected = new UserContext(7L, "agent", 11L, "sid-7");
        String token = jwtTokenService.issueAccessToken(expected);
        when(loginSessionService.validateAndTouch("sid-7")).thenReturn(true);
        MockHttpServletRequest request = new MockHttpServletRequest("GET", "/api/v1/tickets");
        request.addHeader("Authorization", "Bearer " + token);
        MockHttpServletResponse response = new MockHttpServletResponse();
        AtomicReference<Authentication> authenticationRef = new AtomicReference<>();
        AtomicReference<UserContext> contextRef = new AtomicReference<>();
        FilterChain chain = (req, res) -> {
            authenticationRef.set(SecurityContextHolder.getContext().getAuthentication());
            contextRef.set(UserContextHolder.current().orElse(null));
        };

        filter.doFilter(request, response, chain);

        assertThat(authenticationRef.get()).isNotNull();
        assertThat(authenticationRef.get().getPrincipal()).isEqualTo(expected);
        assertThat(authenticationRef.get().getAuthorities()).extracting("authority")
                .containsExactly("ROLE_AGENT");
        assertThat(contextRef.get()).isEqualTo(expected);
    }

    @Test
    void leavesAnonymousRequestUnauthenticated() throws ServletException, IOException {
        MockHttpServletRequest request = new MockHttpServletRequest("GET", "/api/v1/health");
        MockHttpServletResponse response = new MockHttpServletResponse();
        AtomicReference<Authentication> authenticationRef = new AtomicReference<>();
        AtomicReference<UserContext> contextRef = new AtomicReference<>();
        FilterChain chain = (req, res) -> {
            authenticationRef.set(SecurityContextHolder.getContext().getAuthentication());
            contextRef.set(UserContextHolder.current().orElse(null));
        };

        filter.doFilter(request, response, chain);

        assertThat(authenticationRef.get()).isNull();
        assertThat(contextRef.get()).isNull();
    }

    @Test
    void leavesProtectedRequestUnauthenticatedWhenTokenMissing() throws ServletException, IOException {
        MockHttpServletRequest request = new MockHttpServletRequest("GET", "/api/v1/tickets");
        MockHttpServletResponse response = new MockHttpServletResponse();
        AtomicReference<Authentication> authenticationRef = new AtomicReference<>();
        AtomicReference<UserContext> contextRef = new AtomicReference<>();
        FilterChain chain = (req, res) -> {
            authenticationRef.set(SecurityContextHolder.getContext().getAuthentication());
            contextRef.set(UserContextHolder.current().orElse(null));
        };

        filter.doFilter(request, response, chain);

        assertThat(authenticationRef.get()).isNull();
        assertThat(contextRef.get()).isNull();
    }

    @Test
    void rejectsRevokedSessionSid() throws ServletException, IOException {
        UserContext expected = new UserContext(7L, "agent", 11L, "sid-revoked");
        String token = jwtTokenService.issueAccessToken(expected);
        when(loginSessionService.validateAndTouch("sid-revoked")).thenReturn(false);
        MockHttpServletRequest request = new MockHttpServletRequest("GET", "/api/v1/tickets");
        request.addHeader("Authorization", "Bearer " + token);
        MockHttpServletResponse response = new MockHttpServletResponse();
        AtomicReference<Authentication> authenticationRef = new AtomicReference<>();
        AtomicReference<UserContext> contextRef = new AtomicReference<>();
        FilterChain chain = (req, res) -> {
            authenticationRef.set(SecurityContextHolder.getContext().getAuthentication());
            contextRef.set(UserContextHolder.current().orElse(null));
        };

        filter.doFilter(request, response, chain);

        assertThat(authenticationRef.get()).isNull();
        assertThat(contextRef.get()).isNull();
    }
}
