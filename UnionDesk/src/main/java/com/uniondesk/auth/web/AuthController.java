package com.uniondesk.auth.web;

import com.uniondesk.auth.core.AuthService;
import com.uniondesk.auth.core.AuthClientHeaders;
import com.uniondesk.auth.core.LoginAuditService.LoginLog;
import com.uniondesk.auth.core.LoginConfigService.LoginConfig;
import com.uniondesk.auth.core.LoginConfigService.UpdateLoginConfigCommand;
import com.uniondesk.auth.core.LoginSessionService.OnlineSession;
import com.uniondesk.auth.core.UserContext;
import com.uniondesk.auth.core.UserContextHolder;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestHeader;

@RestController
@RequestMapping("/api/v1/auth")
public class AuthController {

    private final AuthService authService;

    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    @PostMapping("/login")
    public AuthDtos.LoginResponse login(
            @Valid @RequestBody AuthDtos.LoginRequest request,
            @RequestHeader(AuthClientHeaders.CLIENT_CODE_HEADER) String clientCode,
            HttpServletRequest httpRequest) {
        return authService.login(request, clientCode, httpRequest.getRemoteAddr(), httpRequest.getHeader("User-Agent"));
    }

    @GetMapping("/login-config")
    public AuthDtos.LoginConfigView loginConfig() {
        LoginConfig config = authService.currentConfig();
        return toLoginConfigView(config);
    }

    @PutMapping("/login-config")
    public AuthDtos.LoginConfigView updateLoginConfig(@Valid @RequestBody AuthDtos.UpdateLoginConfigRequest request) {
        requireAdminContext();
        LoginConfig config = authService.updateConfig(new UpdateLoginConfigCommand(
                request.passwordLoginEnabled(),
                request.usernameLoginEnabled(),
                request.emailLoginEnabled(),
                request.mobileLoginEnabled(),
                request.captchaEnabled(),
                request.wechatLoginEnabled(),
                request.captchaHint(),
                request.wechatHint(),
                request.sessionTtlSeconds(),
                request.maxActiveSessionsPerUser()));
        return toLoginConfigView(config);
    }

    @GetMapping("/session")
    public AuthDtos.SessionView currentSession() {
        return authService.currentSession(requireCurrentContext());
    }

    @GetMapping("/online-sessions")
    public List<AuthDtos.OnlineSessionView> listOnlineSessions(@RequestParam(defaultValue = "100") int limit) {
        requireAdminContext();
        return authService.listOnlineSessions(limit).stream()
                .map(this::toOnlineSessionView)
                .toList();
    }

    @PostMapping("/online-sessions/{sid}/revoke")
    public void revokeSession(@PathVariable String sid, HttpServletRequest httpRequest) {
        requireAdminContext();
        int updated = authService.revokeSession(sid, "admin_revoke", httpRequest.getRemoteAddr(), httpRequest.getHeader("User-Agent"));
        if (updated == 0) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "session not found");
        }
    }

    @PostMapping("/users/{userId}/revoke-sessions")
    public void revokeSessionsByUser(@PathVariable long userId, HttpServletRequest httpRequest) {
        requireAdminContext();
        int updated = authService.revokeSessionsByUser(userId, "admin_revoke_all", httpRequest.getRemoteAddr(), httpRequest.getHeader("User-Agent"));
        if (updated == 0) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "sessions not found");
        }
    }

    @GetMapping("/login-logs")
    public List<AuthDtos.LoginLogView> listLoginLogs(@RequestParam(defaultValue = "100") int limit) {
        requireAdminContext();
        return authService.listLoginLogs(limit).stream()
                .map(this::toLoginLogView)
                .toList();
    }

    @PostMapping("/logout")
    public void logout(HttpServletRequest httpRequest) {
        authService.logoutCurrentSession(
                UserContextHolder.requireCurrent(),
                httpRequest.getRemoteAddr(),
                httpRequest.getHeader("User-Agent"));
    }

    private AuthDtos.LoginConfigView toLoginConfigView(LoginConfig config) {
        return new AuthDtos.LoginConfigView(
                config.passwordLoginEnabled(),
                config.usernameLoginEnabled(),
                config.emailLoginEnabled(),
                config.mobileLoginEnabled(),
                config.captchaEnabled(),
                config.wechatLoginEnabled(),
                config.captchaHint(),
                config.wechatHint(),
                config.sessionTtlSeconds(),
                config.maxActiveSessionsPerUser(),
                config.updatedAt());
    }

    private AuthDtos.OnlineSessionView toOnlineSessionView(OnlineSession session) {
        return new AuthDtos.OnlineSessionView(
                session.sid(),
                session.userId(),
                session.clientCode(),
                session.username(),
                session.mobile(),
                session.email(),
                session.roleCode(),
                session.businessDomainId(),
                session.loginIdentifierMasked(),
                session.sessionStatus(),
                session.issuedAt(),
                session.expiresAt(),
                session.lastSeenAt(),
                session.clientIp(),
                session.userAgent());
    }

    private AuthDtos.LoginLogView toLoginLogView(LoginLog log) {
        return new AuthDtos.LoginLogView(
                log.id(),
                log.sid(),
                log.userId(),
                log.username(),
                log.loginIdentifierMasked(),
                log.loginIdentifierType(),
                log.eventType(),
                log.result(),
                log.reason(),
                log.clientIp(),
                log.userAgent(),
                log.createdAt());
    }

    private UserContext requireCurrentContext() {
        return UserContextHolder.current()
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "unauthorized"));
    }

    private UserContext requireAdminContext() {
        UserContext context = requireCurrentContext();
        if (!"super_admin".equalsIgnoreCase(context.role())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "forbidden");
        }
        return context;
    }
}
