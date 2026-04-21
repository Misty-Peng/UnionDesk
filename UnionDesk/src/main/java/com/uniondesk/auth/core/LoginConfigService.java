package com.uniondesk.auth.core;

import java.time.Clock;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.HashMap;
import java.util.Map;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.ResultSetExtractor;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

@Service
public class LoginConfigService {

    private static final String PASSWORD_LOGIN_ENABLED = "password_login_enabled";
    private static final String USERNAME_LOGIN_ENABLED = "username_login_enabled";
    private static final String EMAIL_LOGIN_ENABLED = "email_login_enabled";
    private static final String MOBILE_LOGIN_ENABLED = "mobile_login_enabled";
    private static final String CAPTCHA_ENABLED = "captcha_enabled";
    private static final String WECHAT_LOGIN_ENABLED = "wechat_login_enabled";
    private static final String CAPTCHA_HINT = "captcha_hint";
    private static final String WECHAT_HINT = "wechat_hint";
    private static final String SESSION_TTL_SECONDS = "session_ttl_seconds";
    private static final String MAX_ACTIVE_SESSIONS_PER_USER = "max_active_sessions_per_user";

    private final JdbcTemplate jdbcTemplate;
    private final Clock clock;

    public LoginConfigService(JdbcTemplate jdbcTemplate, Clock clock) {
        this.jdbcTemplate = jdbcTemplate;
        this.clock = clock;
    }

    public LoginConfig loadConfig() {
        Map<String, String> values = new HashMap<>();
        jdbcTemplate.query("""
                        SELECT config_key, config_value
                        FROM auth_login_config
                        """,
                (ResultSetExtractor<Void>) rs -> {
                    while (rs.next()) {
                        values.put(rs.getString("config_key"), rs.getString("config_value"));
                    }
                    return null;
                });
        return new LoginConfig(
                getBoolean(values, PASSWORD_LOGIN_ENABLED, true),
                getBoolean(values, USERNAME_LOGIN_ENABLED, true),
                getBoolean(values, EMAIL_LOGIN_ENABLED, true),
                getBoolean(values, MOBILE_LOGIN_ENABLED, true),
                getBoolean(values, CAPTCHA_ENABLED, false),
                getBoolean(values, WECHAT_LOGIN_ENABLED, false),
                getString(values, CAPTCHA_HINT, null),
                getString(values, WECHAT_HINT, null),
                getInt(values, SESSION_TTL_SECONDS, 7 * 24 * 60 * 60),
                getInt(values, MAX_ACTIVE_SESSIONS_PER_USER, 10),
                latestUpdatedAt());
    }

    public LoginConfig updateConfig(UpdateLoginConfigCommand command) {
        if (command.passwordLoginEnabled() != null) {
            upsert(PASSWORD_LOGIN_ENABLED, command.passwordLoginEnabled().toString());
        }
        if (command.usernameLoginEnabled() != null) {
            upsert(USERNAME_LOGIN_ENABLED, command.usernameLoginEnabled().toString());
        }
        if (command.emailLoginEnabled() != null) {
            upsert(EMAIL_LOGIN_ENABLED, command.emailLoginEnabled().toString());
        }
        if (command.mobileLoginEnabled() != null) {
            upsert(MOBILE_LOGIN_ENABLED, command.mobileLoginEnabled().toString());
        }
        if (command.captchaEnabled() != null) {
            upsert(CAPTCHA_ENABLED, command.captchaEnabled().toString());
        }
        if (command.wechatLoginEnabled() != null) {
            upsert(WECHAT_LOGIN_ENABLED, command.wechatLoginEnabled().toString());
        }
        if (command.captchaHint() != null) {
            upsert(CAPTCHA_HINT, command.captchaHint());
        }
        if (command.wechatHint() != null) {
            upsert(WECHAT_HINT, command.wechatHint());
        }
        if (command.sessionTtlSeconds() != null) {
            upsert(SESSION_TTL_SECONDS, command.sessionTtlSeconds().toString());
        }
        if (command.maxActiveSessionsPerUser() != null) {
            upsert(MAX_ACTIVE_SESSIONS_PER_USER, command.maxActiveSessionsPerUser().toString());
        }
        return loadConfig();
    }

    private void upsert(String key, String value) {
        jdbcTemplate.update("""
                        INSERT INTO auth_login_config (config_key, config_value)
                        VALUES (?, ?)
                        ON DUPLICATE KEY UPDATE
                            config_value = VALUES(config_value),
                            updated_at = CURRENT_TIMESTAMP(3)
                        """, key, value);
    }

    private boolean getBoolean(Map<String, String> values, String key, boolean defaultValue) {
        String value = values.get(key);
        return StringUtils.hasText(value) ? Boolean.parseBoolean(value) : defaultValue;
    }

    private int getInt(Map<String, String> values, String key, int defaultValue) {
        String value = values.get(key);
        if (!StringUtils.hasText(value)) {
            return defaultValue;
        }
        try {
            return Integer.parseInt(value);
        } catch (NumberFormatException ex) {
            return defaultValue;
        }
    }

    private String getString(Map<String, String> values, String key, String defaultValue) {
        String value = values.get(key);
        return StringUtils.hasText(value) ? value : defaultValue;
    }

    private LocalDateTime latestUpdatedAt() {
        LocalDateTime updatedAt = jdbcTemplate.queryForObject("""
                        SELECT MAX(updated_at)
                        FROM auth_login_config
                        """, LocalDateTime.class);
        if (updatedAt != null) {
            return updatedAt;
        }
        return LocalDateTime.now(clock.withZone(ZoneId.of("UTC")));
    }

    public record LoginConfig(
            boolean passwordLoginEnabled,
            boolean usernameLoginEnabled,
            boolean emailLoginEnabled,
            boolean mobileLoginEnabled,
            boolean captchaEnabled,
            boolean wechatLoginEnabled,
            String captchaHint,
            String wechatHint,
            int sessionTtlSeconds,
            int maxActiveSessionsPerUser,
            LocalDateTime updatedAt) {
    }

    public record UpdateLoginConfigCommand(
            Boolean passwordLoginEnabled,
            Boolean usernameLoginEnabled,
            Boolean emailLoginEnabled,
            Boolean mobileLoginEnabled,
            Boolean captchaEnabled,
            Boolean wechatLoginEnabled,
            String captchaHint,
            String wechatHint,
            Integer sessionTtlSeconds,
            Integer maxActiveSessionsPerUser) {
    }
}
