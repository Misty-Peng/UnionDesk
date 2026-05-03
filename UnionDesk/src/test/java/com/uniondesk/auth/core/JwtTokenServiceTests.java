package com.uniondesk.auth.core;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import com.fasterxml.jackson.databind.ObjectMapper;
import java.time.Duration;
import org.junit.jupiter.api.Test;

class JwtTokenServiceTests {

    private static final String SECRET = "uniondesk-demo-jwt-secret-please-change-me";

    private final JwtTokenService jwtTokenService = new JwtTokenService(
            new ObjectMapper(),
            SECRET,
            "uniondesk",
            Duration.ofHours(24),
            Duration.ofDays(7));

    @Test
    void issueAndParseAccessToken() {
        UserContext expected = new UserContext(42L, "super_admin", 7L, "sid-42", "ud-admin-web");

        String token = jwtTokenService.issueAccessToken(expected);

        assertThat(token).contains(".");
        UserContext actual = jwtTokenService.parseAccessToken(token);
        assertThat(actual).isEqualTo(expected);
    }

    @Test
    void rejectTamperedAccessToken() {
        String token = jwtTokenService.issueAccessToken(new UserContext(42L, "agent", 7L, "sid-42", "ud-admin-web"));
        String[] parts = token.split("\\.");
        String signature = parts[2];
        String tamperedSignature = (signature.startsWith("A") ? "B" : "A") + signature.substring(1);
        String tampered = parts[0] + "." + parts[1] + "." + tamperedSignature;

        assertThatThrownBy(() -> jwtTokenService.parseAccessToken(tampered))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("invalid access token");
    }
}
