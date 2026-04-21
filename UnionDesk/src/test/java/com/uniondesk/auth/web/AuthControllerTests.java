package com.uniondesk.auth.web;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.uniondesk.auth.core.AuthService;
import com.uniondesk.auth.core.AuthenticationFailedException;
import com.uniondesk.auth.core.LoginAuditService.LoginLog;
import com.uniondesk.auth.core.LoginConfigService.LoginConfig;
import com.uniondesk.auth.core.LoginSessionService.OnlineSession;
import com.uniondesk.auth.core.UserContext;
import com.uniondesk.auth.core.UserContextHolder;
import java.time.LocalDateTime;
import java.util.List;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.AfterEach;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

class AuthControllerTests {

    @AfterEach
    void clearUserContext() {
        UserContextHolder.clear();
    }

    @Test
    void loginFailureMapsToUnauthorized() throws Exception {
        AuthService authService = org.mockito.Mockito.mock(AuthService.class);
        when(authService.login(org.mockito.ArgumentMatchers.any(AuthDtos.LoginRequest.class), org.mockito.ArgumentMatchers.anyString(), org.mockito.ArgumentMatchers.anyString()))
                .thenThrow(new AuthenticationFailedException("invalid credentials"));
        MockMvc mockMvc = MockMvcBuilders.standaloneSetup(new AuthController(authService))
                .setControllerAdvice(new com.uniondesk.common.web.ApiExceptionHandler())
                .build();

        mockMvc.perform(post("/api/v1/auth/login")
                        .contentType("application/json")
                        .header("User-Agent", "JUnit")
                        .content("{\"username\":\"customer\",\"password\":\"wrong\"}"))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.code").value("UNAUTHORIZED"));
    }

    @Test
    void sessionReturnsCurrentContext() throws Exception {
        AuthService authService = mock(AuthService.class);
        MockMvc mockMvc = mockMvc(authService);
        UserContextHolder.set(new UserContext(2L, "super_admin", 10L, "sid-123"));
        when(authService.currentSession(any(UserContext.class)))
                .thenReturn(new AuthDtos.SessionView(2L, "super_admin", 10L, "sid-123"));

        mockMvc.perform(get("/api/v1/auth/session"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.userId").value(2))
                .andExpect(jsonPath("$.role").value("super_admin"))
                .andExpect(jsonPath("$.businessDomainId").value(10))
                .andExpect(jsonPath("$.sid").value("sid-123"));
    }

    @Test
    void sessionWithoutAuthenticationReturnsUnauthorized() throws Exception {
        MockMvc mockMvc = mockMvc(mock(AuthService.class));

        mockMvc.perform(get("/api/v1/auth/session"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void updateLoginConfigReturnsNewFlagsForAdmin() throws Exception {
        AuthService authService = mock(AuthService.class);
        MockMvc mockMvc = mockMvc(authService);
        UserContextHolder.set(new UserContext(2L, "super_admin", 10L, "sid-123"));
        when(authService.updateConfig(any()))
                .thenReturn(new LoginConfig(
                        true,
                        true,
                        true,
                        true,
                        true,
                        true,
                        "captcha-hint",
                        "wechat-hint",
                        7200,
                        5,
                        LocalDateTime.parse("2026-04-21T08:00:00")));

        mockMvc.perform(put("/api/v1/auth/login-config")
                        .contentType("application/json")
                        .content("""
                                {
                                  "captchaEnabled": true,
                                  "wechatLoginEnabled": true,
                                  "captchaHint": "captcha-hint",
                                  "wechatHint": "wechat-hint"
                                }
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.captchaEnabled").value(true))
                .andExpect(jsonPath("$.wechatLoginEnabled").value(true))
                .andExpect(jsonPath("$.captchaHint").value("captcha-hint"))
                .andExpect(jsonPath("$.wechatHint").value("wechat-hint"));
        verify(authService).updateConfig(any());
    }

    @Test
    void updateLoginConfigRejectsNonAdminContext() throws Exception {
        AuthService authService = mock(AuthService.class);
        MockMvc mockMvc = mockMvc(authService);
        UserContextHolder.set(new UserContext(1L, "customer", 10L, "sid-123"));

        mockMvc.perform(put("/api/v1/auth/login-config")
                        .contentType("application/json")
                        .content("{\"captchaEnabled\":true}"))
                .andExpect(status().isForbidden());
    }

    @Test
    void listOnlineSessionsReturnsRowsForAdmin() throws Exception {
        AuthService authService = mock(AuthService.class);
        MockMvc mockMvc = mockMvc(authService);
        UserContextHolder.set(new UserContext(2L, "super_admin", 10L, "sid-123"));
        when(authService.listOnlineSessions(25)).thenReturn(List.of(new OnlineSession(
                "sid-1",
                1L,
                "customer",
                "13800000000",
                "customer@uniondesk.local",
                "customer",
                10L,
                "c***r",
                "active",
                LocalDateTime.parse("2026-04-21T08:00:00"),
                LocalDateTime.parse("2026-04-28T08:00:00"),
                LocalDateTime.parse("2026-04-21T08:05:00"),
                "127.0.0.1",
                "JUnit")));

        mockMvc.perform(get("/api/v1/auth/online-sessions").param("limit", "25"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].sid").value("sid-1"))
                .andExpect(jsonPath("$[0].username").value("customer"))
                .andExpect(jsonPath("$[0].sessionStatus").value("active"));
    }

    @Test
    void revokeSessionReturnsNotFoundWhenSidMissing() throws Exception {
        AuthService authService = mock(AuthService.class);
        MockMvc mockMvc = mockMvc(authService);
        UserContextHolder.set(new UserContext(2L, "super_admin", 10L, "sid-123"));
        when(authService.revokeSession("sid-404", "admin_revoke", "127.0.0.1", "JUnit")).thenReturn(0);

        mockMvc.perform(post("/api/v1/auth/online-sessions/sid-404/revoke")
                        .header("User-Agent", "JUnit"))
                .andExpect(status().isNotFound());
    }

    @Test
    void revokeSessionsByUserSucceedsForAdmin() throws Exception {
        AuthService authService = mock(AuthService.class);
        MockMvc mockMvc = mockMvc(authService);
        UserContextHolder.set(new UserContext(2L, "super_admin", 10L, "sid-123"));
        when(authService.revokeSessionsByUser(1L, "admin_revoke_all", "127.0.0.1", "JUnit")).thenReturn(2);

        mockMvc.perform(post("/api/v1/auth/users/1/revoke-sessions")
                        .header("User-Agent", "JUnit"))
                .andExpect(status().isOk());
        verify(authService).revokeSessionsByUser(1L, "admin_revoke_all", "127.0.0.1", "JUnit");
    }

    @Test
    void listLoginLogsReturnsRowsForAdmin() throws Exception {
        AuthService authService = mock(AuthService.class);
        MockMvc mockMvc = mockMvc(authService);
        UserContextHolder.set(new UserContext(2L, "super_admin", 10L, "sid-123"));
        when(authService.listLoginLogs(10)).thenReturn(List.of(new LoginLog(
                1L,
                "sid-1",
                1L,
                "customer",
                "c***r",
                "USERNAME",
                "LOGIN",
                "SUCCESS",
                null,
                "127.0.0.1",
                "JUnit",
                LocalDateTime.parse("2026-04-21T08:00:00"))));

        mockMvc.perform(get("/api/v1/auth/login-logs").param("limit", "10"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].sid").value("sid-1"))
                .andExpect(jsonPath("$[0].eventType").value("LOGIN"))
                .andExpect(jsonPath("$[0].result").value("SUCCESS"));
    }

    private MockMvc mockMvc(AuthService authService) {
        return MockMvcBuilders.standaloneSetup(new AuthController(authService))
                .setControllerAdvice(new com.uniondesk.common.web.ApiExceptionHandler())
                .build();
    }
}
