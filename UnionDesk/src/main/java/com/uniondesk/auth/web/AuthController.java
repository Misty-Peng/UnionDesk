package com.uniondesk.auth.web;

import com.uniondesk.auth.core.JwtTokenService;
import com.uniondesk.auth.core.UserContext;
import com.uniondesk.common.demo.DemoDataService;
import com.uniondesk.common.demo.DemoDtos.LoginResponse;
import com.uniondesk.common.demo.DemoDtos.LoginUserView;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import java.util.List;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/auth")
public class AuthController {

    private final JwtTokenService jwtTokenService;
    private final DemoDataService demoDataService;

    public AuthController(JwtTokenService jwtTokenService, DemoDataService demoDataService) {
        this.jwtTokenService = jwtTokenService;
        this.demoDataService = demoDataService;
    }

    @PostMapping("/login")
    public LoginResponse login(@Valid @RequestBody LoginRequest request) {
        DemoAccount account = resolveAccount(request.username(), request.password());
        if (account == null) {
            throw new IllegalArgumentException("invalid credentials");
        }
        UserContext userContext = new UserContext(account.userId(), account.role(), demoDataService.defaultBusinessDomainId());
        String accessToken = jwtTokenService.issueAccessToken(userContext);
        String refreshToken = jwtTokenService.issueRefreshToken(userContext);
        return new LoginResponse(
                accessToken,
                refreshToken,
                userContext.role(),
                "Bearer",
                jwtTokenService.accessTokenTtl().toSeconds(),
                new LoginUserView(
                        userContext.userId(),
                        account.username(),
                        account.mobile(),
                        account.email(),
                        List.of(userContext.role())),
                demoDataService.listBusinessDomains(),
                demoDataService.defaultBusinessDomainId());
    }

    private DemoAccount resolveAccount(String username, String password) {
        boolean adminLogin = ("admin".equals(username) || "13800000001".equals(username) || "agent@uniondesk.local".equals(username))
                && "admin123".equals(password);
        if (adminLogin) {
            return new DemoAccount(2L, username, "13800000001", "agent@uniondesk.local", "super_admin");
        }
        boolean customerLogin = ("customer".equals(username) || "13800000000".equals(username) || "customer@uniondesk.local".equals(username))
                && "customer123".equals(password);
        if (customerLogin) {
            return new DemoAccount(1L, username, "13800000000", "customer@uniondesk.local", "customer");
        }
        return null;
    }

    public record LoginRequest(@NotBlank String username, @NotBlank String password) {
    }

    private record DemoAccount(long userId, String username, String mobile, String email, String role) {
    }
}
