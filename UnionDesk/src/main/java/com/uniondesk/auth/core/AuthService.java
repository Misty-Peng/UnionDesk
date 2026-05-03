package com.uniondesk.auth.core;

import com.uniondesk.auth.core.LoginAccountService.LoginAccount;
import com.uniondesk.auth.core.AuthClientService.AuthClient;
import com.uniondesk.auth.core.LoginAuditService.LoginLog;
import com.uniondesk.auth.core.LoginConfigService.LoginConfig;
import com.uniondesk.auth.core.LoginSessionService.OnlineSession;
import com.uniondesk.auth.web.AuthDtos;
import com.uniondesk.common.demo.DemoDataService;
import com.uniondesk.common.demo.DemoDtos.BusinessDomainView;
import com.uniondesk.common.demo.DemoDtos.LoginUserView;
import com.uniondesk.iam.core.IamService;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.time.Clock;
import java.time.LocalDateTime;
import java.util.Comparator;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

@Service
public class AuthService {

    private final LoginAccountService loginAccountService;
    private final AuthClientService authClientService;
    private final LoginConfigService loginConfigService;
    private final LoginSessionService loginSessionService;
    private final LoginAuditService loginAuditService;
    private final IamService iamService;
    private final JwtTokenService jwtTokenService;
    private final PasswordEncoder passwordEncoder;
    private final DemoDataService demoDataService;
    private final AuthCaptchaService authCaptchaService;
    private final Clock clock;

    public AuthService(
            LoginAccountService loginAccountService,
            AuthClientService authClientService,
            LoginConfigService loginConfigService,
            LoginSessionService loginSessionService,
            LoginAuditService loginAuditService,
            IamService iamService,
            JwtTokenService jwtTokenService,
            PasswordEncoder passwordEncoder,
            DemoDataService demoDataService,
            AuthCaptchaService authCaptchaService,
            Clock clock) {
        this.loginAccountService = loginAccountService;
        this.authClientService = authClientService;
        this.loginConfigService = loginConfigService;
        this.loginSessionService = loginSessionService;
        this.loginAuditService = loginAuditService;
        this.iamService = iamService;
        this.jwtTokenService = jwtTokenService;
        this.passwordEncoder = passwordEncoder;
        this.demoDataService = demoDataService;
        this.authCaptchaService = authCaptchaService;
        this.clock = clock;
    }

    public AuthDtos.LoginResponse login(AuthDtos.LoginRequest request, String clientCode, String clientIp, String userAgent) {
        if (!StringUtils.hasText(clientCode)) {
            throw new IllegalArgumentException("missing client code");
        }
        AuthClient authClient = authClientService.findByCode(clientCode)
                .orElseThrow(() -> new AuthenticationFailedException("invalid client"));
        if (authClient.status() != 1) {
            throw new AuthenticationFailedException("invalid client");
        }

        LoginIdentifierType identifierType = LoginIdentifierType.detect(request.username());
        LoginConfig config = loginConfigService.loadConfig();
        if (config.captchaEnabled()) {
            if (!StringUtils.hasText(request.captchaToken())) {
                throw new AuthCaptchaException("请先完成滑块验证");
            }
            authCaptchaService.consumeToken(request.captchaToken());
        }
        if (!isIdentifierTypeEnabled(config, identifierType) || !config.passwordLoginEnabled()) {
            loginAuditService.record(loginAuditService.loginFailure(
                    null,
                    null,
                    null,
                    identifierType.name(),
                    request.username(),
                    "login_disabled",
                    clientIp,
                    userAgent));
            throw new AuthenticationFailedException("invalid credentials");
        }

        LoginAccount account = loginAccountService.findByIdentifier(request.username(), identifierType)
                .orElseThrow(() -> failLogin(null, null, identifierType, request.username(), "account_not_found", clientIp, userAgent));

        if (account.status() != 1) {
            throw failLogin(account.id(), account.username(), identifierType, request.username(), "account_disabled", clientIp, userAgent);
        }
        if ("offboarded".equalsIgnoreCase(account.employmentStatus())) {
            throw failLogin(account.id(), account.username(), identifierType, request.username(), "account_offboarded", clientIp, userAgent);
        }
        if (!passwordEncoder.matches(request.password(), account.passwordHash())) {
            throw failLogin(account.id(), account.username(), identifierType, request.username(), "password_mismatch", clientIp, userAgent);
        }
        List<String> roles = iamService.listUserRoleCodesByClient(account.id(), authClient.clientCode());
        if (roles.isEmpty()) {
            throw failLogin(account.id(), account.username(), identifierType, request.username(), "roles_missing", clientIp, userAgent);
        }
        String effectiveRole = roles.get(0);
        List<Long> accessibleDomainIds = loginAccountService.loadAccessibleDomainIds(account.id(), roles);
        List<BusinessDomainView> accessibleDomains = resolveAccessibleDomains(accessibleDomainIds);
        long defaultBusinessDomainId = accessibleDomains.isEmpty()
                ? demoDataService.defaultBusinessDomainId()
                : accessibleDomains.get(0).id();

        String sid = UUID.randomUUID().toString();
        UserContext userContext = new UserContext(account.id(), effectiveRole, defaultBusinessDomainId, sid, authClient.clientCode());
        LocalDateTime sessionExpiresAt = LocalDateTime.now(clock).plusSeconds(config.sessionTtlSeconds());
        String refreshToken = jwtTokenService.issueRefreshToken(userContext);
        loginSessionService.createSession(new LoginSessionService.CreateSessionCommand(
                sid,
                account.id(),
                authClient.clientCode(),
                effectiveRole,
                defaultBusinessDomainId,
                maskIdentifier(request.username(), identifierType),
                sessionExpiresAt,
                sha256(refreshToken),
                clientIp,
                userAgent));
        String accessToken = jwtTokenService.issueAccessToken(userContext);
        loginAuditService.record(loginAuditService.loginSuccess(
                sid,
                account.id(),
                account.username(),
                identifierType.name(),
                request.username(),
                clientIp,
                userAgent));
        return new AuthDtos.LoginResponse(
                accessToken,
                refreshToken,
                sid,
                effectiveRole,
                authClient.clientCode(),
                "Bearer",
                jwtTokenService.accessTokenTtl().toSeconds(),
                new LoginUserView(account.id(), account.username(), account.mobile(), account.email(), roles),
                accessibleDomains,
                defaultBusinessDomainId);
    }

    public AuthDtos.RefreshResponse refreshToken(String refreshToken) {
        UserContext oldContext;
        try {
            oldContext = jwtTokenService.parseRefreshToken(refreshToken);
        } catch (IllegalArgumentException ex) {
            throw new AuthenticationFailedException("invalid refresh token");
        }
        if (!loginSessionService.validateAndTouch(oldContext.sessionId(), oldContext.clientCode())) {
            throw new AuthenticationFailedException("session expired or revoked");
        }
        String newAccessToken = jwtTokenService.issueAccessToken(oldContext);
        String newRefreshToken = jwtTokenService.issueRefreshToken(oldContext);
        return new AuthDtos.RefreshResponse(
                newAccessToken,
                newRefreshToken,
                "Bearer",
                jwtTokenService.accessTokenTtl().toSeconds());
    }

    public AuthDtos.CurrentUserResponse currentUser(UserContext context) {
        LoginAccount account = loginAccountService.findById(context.userId())
                .orElseThrow(() -> new AuthenticationFailedException("account not found"));
        List<String> roles = iamService.listUserRoleCodesByClient(context.userId(), context.clientCode());
        return new AuthDtos.CurrentUserResponse(
                account.id(),
                account.username(),
                account.mobile(),
                account.email(),
                context.role(),
                context.clientCode(),
                context.businessDomainId(),
                roles);
    }

    public AuthDtos.StepUpResponse stepUp(UserContext context, String password) {
        LoginAccount account = loginAccountService.findById(context.userId())
                .orElseThrow(() -> new AuthenticationFailedException("account not found"));
        if (!passwordEncoder.matches(password, account.passwordHash())) {
            throw new AuthenticationFailedException("invalid credentials");
        }
        String stepUpToken = UUID.randomUUID().toString();
        return new AuthDtos.StepUpResponse(stepUpToken, "session_15m", 900);
    }

    public AuthDtos.SessionView currentSession(UserContext context) {
        return new AuthDtos.SessionView(
                context.userId(),
                context.role(),
                context.businessDomainId(),
                context.sessionId(),
                context.clientCode());
    }

    public void logoutCurrentSession(UserContext context, String clientIp, String userAgent) {
        loginSessionService.revokeSession(context.sessionId(), "user_logout");
        loginAuditService.record(loginAuditService.sessionEvent(
                context.sessionId(),
                context.userId(),
                null,
                "USERNAME",
                null,
                "LOGOUT",
                "SUCCESS",
                "user_logout",
                clientIp,
                userAgent));
    }

    public List<OnlineSession> listOnlineSessions(int limit) {
        return loginSessionService.listOnlineSessions(limit);
    }

    public int revokeSession(String sid, String reason, String clientIp, String userAgent) {
        int updated = loginSessionService.revokeSession(sid, reason);
        if (updated > 0) {
            loginAuditService.record(loginAuditService.sessionEvent(
                    sid,
                    null,
                    null,
                    "USERNAME",
                    null,
                    "FORCE_LOGOUT",
                    "SUCCESS",
                    reason,
                    clientIp,
                    userAgent));
        }
        return updated;
    }

    public int revokeSessionsByUser(long userId, String reason, String clientIp, String userAgent) {
        int updated = loginSessionService.revokeSessionsByUser(userId, reason);
        if (updated > 0) {
            loginAuditService.record(loginAuditService.sessionEvent(
                    null,
                    userId,
                    null,
                    "USERNAME",
                    null,
                    "FORCE_LOGOUT",
                    "SUCCESS",
                    reason,
                    clientIp,
                    userAgent));
        }
        return updated;
    }

    public LoginConfig currentConfig() {
        return loginConfigService.loadConfig();
    }

    public LoginConfig updateConfig(LoginConfigService.UpdateLoginConfigCommand command) {
        return loginConfigService.updateConfig(command);
    }

    public List<LoginLog> listLoginLogs(int limit) {
        return loginAuditService.listRecentLogs(limit);
    }

    private AuthenticationFailedException failLogin(
            Long userId,
            String username,
            LoginIdentifierType identifierType,
            String identifier,
            String reason,
            String clientIp,
            String userAgent) {
        loginAuditService.record(loginAuditService.loginFailure(
                null,
                userId,
                username,
                identifierType.name(),
                identifier,
                reason,
                clientIp,
                userAgent));
        return new AuthenticationFailedException("invalid credentials");
    }

    private boolean isIdentifierTypeEnabled(LoginConfig config, LoginIdentifierType type) {
        return switch (type) {
            case USERNAME -> config.usernameLoginEnabled();
            case EMAIL -> config.emailLoginEnabled();
            case MOBILE -> config.mobileLoginEnabled();
        };
    }

    private List<BusinessDomainView> resolveAccessibleDomains(List<Long> accessibleDomainIds) {
        if (accessibleDomainIds.isEmpty()) {
            return filterDomains(List.of(demoDataService.defaultBusinessDomainId()));
        }
        return filterDomains(accessibleDomainIds);
    }

    private List<BusinessDomainView> filterDomains(List<Long> accessibleDomainIds) {
        List<BusinessDomainView> allDomains = demoDataService.listBusinessDomains();
        return allDomains.stream()
                .filter(domain -> accessibleDomainIds.contains(domain.id()))
                .sorted(Comparator.comparingLong(BusinessDomainView::id))
                .collect(Collectors.toList());
    }

    private String maskIdentifier(String identifier, LoginIdentifierType type) {
        return loginAuditService.maskIdentifier(identifier, type.name());
    }

    private String sha256(String value) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            return bytesToHex(digest.digest(value.getBytes(StandardCharsets.UTF_8)));
        } catch (NoSuchAlgorithmException ex) {
            throw new IllegalStateException("SHA-256 is unavailable", ex);
        }
    }

    private String bytesToHex(byte[] bytes) {
        StringBuilder builder = new StringBuilder(bytes.length * 2);
        for (byte value : bytes) {
            builder.append(Character.forDigit((value >> 4) & 0xF, 16));
            builder.append(Character.forDigit(value & 0xF, 16));
        }
        return builder.toString();
    }
}
