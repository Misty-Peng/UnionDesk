package com.uniondesk.auth.web;

import java.util.Map;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/auth")
public class AuthController {

    private static final Set<String> VALID_TOKENS = ConcurrentHashMap.newKeySet();

    @PostMapping("/login")
    public Map<String, String> login(@RequestBody LoginRequest request) {
        if (!"admin".equals(request.username()) || !"admin123".equals(request.password())) {
            throw new IllegalArgumentException("invalid credentials");
        }
        String accessToken = "demo-access-token";
        String refreshToken = "demo-refresh-token";
        VALID_TOKENS.add(accessToken);
        return Map.of(
                "accessToken", accessToken,
                "refreshToken", refreshToken,
                "role", "super_admin");
    }

    public static boolean isValidToken(String token) {
        return token != null && VALID_TOKENS.contains(token);
    }

    public record LoginRequest(String username, String password) {
    }
}
