package com.uniondesk.auth.core;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.uniondesk.auth.core.AuthClientService.AuthClient;
import com.uniondesk.auth.core.LoginAccountService.LoginAccount;
import com.uniondesk.auth.core.LoginConfigService.LoginConfig;
import com.uniondesk.auth.web.AuthDtos;
import com.uniondesk.common.demo.DemoDataService;
import com.uniondesk.common.demo.DemoDtos.BusinessDomainView;
import com.uniondesk.iam.core.IamService;
import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.time.LocalDateTime;
import java.time.ZoneOffset;
import java.util.List;
import java.util.Optional;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.factory.PasswordEncoderFactories;
import org.springframework.security.crypto.password.PasswordEncoder;

@ExtendWith(MockitoExtension.class)
class AuthServiceTests {

    private static final Clock CLOCK = Clock.fixed(Instant.parse("2026-04-21T00:00:00Z"), ZoneOffset.UTC);

    @Mock
    private LoginAccountService loginAccountService;

    @Mock
    private AuthClientService authClientService;

    @Mock
    private LoginConfigService loginConfigService;

    @Mock
    private LoginSessionService loginSessionService;

    @Mock
    private LoginAuditService loginAuditService;

    @Mock
    private IamService iamService;

    @Mock
    private DemoDataService demoDataService;

    @Mock
    private AuthCaptchaService authCaptchaService;

    private final JwtTokenService jwtTokenService = new JwtTokenService(
            new ObjectMapper(),
            "uniondesk-demo-jwt-secret-please-change-me",
            "uniondesk",
            Duration.ofHours(24),
            Duration.ofDays(7));

    private final PasswordEncoder passwordEncoder = PasswordEncoderFactories.createDelegatingPasswordEncoder();

    private AuthService authService;

    @BeforeEach
    void setUp() {
        authService = new AuthService(
                loginAccountService,
                authClientService,
                loginConfigService,
                loginSessionService,
                loginAuditService,
                iamService,
                jwtTokenService,
                passwordEncoder,
                demoDataService,
                authCaptchaService,
                CLOCK);
    }

    @Test
    void loginSucceedsWithEmailIdentifierAndCreatesSession() {
        LoginAccount account = new LoginAccount(1L, "customer", "13800000000", "customer@uniondesk.local",
                passwordEncoder.encode("customer123"), 1, "customer", "active");
        LoginConfig config = new LoginConfig(
                true,
                true,
                true,
                true,
                false,
                false,
                null,
                null,
                604800,
                10,
                LocalDateTime.now(CLOCK));
        BusinessDomainView domain = new BusinessDomainView(1L, "default", "Default Domain", "global", 1, 0, 0, 0, 0);

        when(authClientService.findByCode("ud-customer-web")).thenReturn(Optional.of(new AuthClient("ud-customer-web", "customer", 1)));
        when(loginConfigService.loadConfig()).thenReturn(config);
        when(loginAccountService.findByIdentifier("customer@uniondesk.local", LoginIdentifierType.EMAIL))
                .thenReturn(Optional.of(account));
        when(iamService.listUserRoleCodesByClient(1L, "ud-customer-web")).thenReturn(List.of("customer"));
        when(loginAccountService.loadAccessibleDomainIds(1L, List.of("customer"))).thenReturn(List.of(1L));
        when(demoDataService.listBusinessDomains()).thenReturn(List.of(domain));
        when(loginSessionService.createSession(any(LoginSessionService.CreateSessionCommand.class)))
                .thenAnswer(invocation -> invocation.getArgument(0, LoginSessionService.CreateSessionCommand.class).sid());

        AuthDtos.LoginResponse response = authService.login(
                new AuthDtos.LoginRequest("customer@uniondesk.local", "customer123"),
                "ud-customer-web",
                "127.0.0.1",
                "JUnit");

        assertThat(response.sid()).isNotBlank();
        assertThat(response.accessToken()).contains(".");
        assertThat(response.user().username()).isEqualTo("customer");
        assertThat(response.user().roles()).containsExactly("customer");
        assertThat(response.clientCode()).isEqualTo("ud-customer-web");
        assertThat(response.accessToken()).isNotEqualTo(response.refreshToken());
        ArgumentCaptor<LoginSessionService.CreateSessionCommand> captor = ArgumentCaptor.forClass(LoginSessionService.CreateSessionCommand.class);
        verify(loginSessionService).createSession(captor.capture());
        assertThat(captor.getValue().sid()).isEqualTo(response.sid());
        assertThat(captor.getValue().clientCode()).isEqualTo("ud-customer-web");
    }

    @Test
    void loginFailsWithBadPasswordAndDoesNotCreateSession() {
        LoginAccount account = new LoginAccount(1L, "customer", "13800000000", "customer@uniondesk.local",
                passwordEncoder.encode("customer123"), 1, "customer", "active");
        LoginConfig config = new LoginConfig(
                true,
                true,
                true,
                true,
                false,
                false,
                null,
                null,
                604800,
                10,
                LocalDateTime.now(CLOCK));

        when(authClientService.findByCode("ud-customer-web")).thenReturn(Optional.of(new AuthClient("ud-customer-web", "customer", 1)));
        when(loginConfigService.loadConfig()).thenReturn(config);
        when(loginAccountService.findByIdentifier("customer", LoginIdentifierType.USERNAME))
                .thenReturn(Optional.of(account));

        assertThatThrownBy(() -> authService.login(
                new AuthDtos.LoginRequest("customer", "wrong-password"),
                "ud-customer-web",
                "127.0.0.1",
                "JUnit"))
                .isInstanceOf(AuthenticationFailedException.class)
                .hasMessage("invalid credentials");
        verify(loginAuditService).record(any());
    }

    @Test
    void loginFailsWhenNoRoleCanAccessClient() {
        LoginAccount account = new LoginAccount(2L, "admin", "13900000000", "admin@uniondesk.local",
                passwordEncoder.encode("admin123"), 1, "admin", "active");
        LoginConfig config = new LoginConfig(
                true,
                true,
                true,
                true,
                false,
                false,
                null,
                null,
                604800,
                10,
                LocalDateTime.now(CLOCK));

        when(authClientService.findByCode("ud-customer-web")).thenReturn(Optional.of(new AuthClient("ud-customer-web", "customer", 1)));
        when(loginConfigService.loadConfig()).thenReturn(config);
        when(loginAccountService.findByIdentifier("admin", LoginIdentifierType.USERNAME))
                .thenReturn(Optional.of(account));
        when(iamService.listUserRoleCodesByClient(2L, "ud-customer-web")).thenReturn(List.of());

        assertThatThrownBy(() -> authService.login(
                new AuthDtos.LoginRequest("admin", "admin123"),
                "ud-customer-web",
                "127.0.0.1",
                "JUnit"))
                .isInstanceOf(AuthenticationFailedException.class)
                .hasMessage("invalid credentials");
        verify(loginAuditService).record(any());
    }

    @Test
    void loginConsumesCaptchaTokenWhenCaptchaEnabled() {
        LoginAccount account = new LoginAccount(2L, "admin", "13900000000", "admin@uniondesk.local",
                passwordEncoder.encode("admin123"), 1, "admin", "active");
        LoginConfig config = new LoginConfig(
                true,
                true,
                true,
                true,
                true,
                false,
                null,
                null,
                604800,
                10,
                LocalDateTime.now(CLOCK));
        BusinessDomainView domain = new BusinessDomainView(1L, "default", "Default Domain", "global", 1, 0, 0, 0, 0);

        when(authClientService.findByCode("ud-admin-web")).thenReturn(Optional.of(new AuthClient("ud-admin-web", "admin", 1)));
        when(loginConfigService.loadConfig()).thenReturn(config);
        when(loginAccountService.findByIdentifier("admin", LoginIdentifierType.USERNAME))
                .thenReturn(Optional.of(account));
        when(iamService.listUserRoleCodesByClient(2L, "ud-admin-web")).thenReturn(List.of("super_admin"));
        when(loginAccountService.loadAccessibleDomainIds(2L, List.of("super_admin"))).thenReturn(List.of(1L));
        when(demoDataService.listBusinessDomains()).thenReturn(List.of(domain));
        when(loginSessionService.createSession(any(LoginSessionService.CreateSessionCommand.class)))
                .thenAnswer(invocation -> invocation.getArgument(0, LoginSessionService.CreateSessionCommand.class).sid());

        AuthDtos.LoginResponse response = authService.login(
                new AuthDtos.LoginRequest("admin", "admin123", "captcha-token-1"),
                "ud-admin-web",
                "127.0.0.1",
                "JUnit");

        assertThat(response.clientCode()).isEqualTo("ud-admin-web");
        verify(authCaptchaService).consumeToken("captcha-token-1");
    }

    @Test
    void loginRejectsMissingCaptchaTokenWhenCaptchaEnabled() {
        LoginConfig config = new LoginConfig(
                true,
                true,
                true,
                true,
                true,
                false,
                null,
                null,
                604800,
                10,
                LocalDateTime.now(CLOCK));

        when(authClientService.findByCode("ud-admin-web")).thenReturn(Optional.of(new AuthClient("ud-admin-web", "admin", 1)));
        when(loginConfigService.loadConfig()).thenReturn(config);

        assertThatThrownBy(() -> authService.login(
                new AuthDtos.LoginRequest("admin", "admin123", null),
                "ud-admin-web",
                "127.0.0.1",
                "JUnit"))
                .isInstanceOf(AuthCaptchaException.class)
                .hasMessage("请先完成滑块验证");
    }
}
