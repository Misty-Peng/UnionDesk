package com.uniondesk.auth.core;

import java.time.Clock;
import java.time.LocalDateTime;
import java.util.List;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

@Service
public class LoginAuditService {

    private final JdbcTemplate jdbcTemplate;
    private final Clock clock;

    public LoginAuditService(JdbcTemplate jdbcTemplate, Clock clock) {
        this.jdbcTemplate = jdbcTemplate;
        this.clock = clock;
    }

    public void record(LoginLogCommand command) {
        jdbcTemplate.update("""
                        INSERT INTO auth_login_log (
                            sid, user_id, username, login_identifier_masked, login_identifier_type,
                            event_type, result, reason, client_ip, user_agent, created_at
                        )
                        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                        """,
                command.sid(),
                command.userId(),
                command.username(),
                command.loginIdentifierMasked(),
                command.loginIdentifierType(),
                command.eventType(),
                command.result(),
                command.reason(),
                command.clientIp(),
                command.userAgent(),
                LocalDateTime.now(clock));
    }

    public List<LoginLog> listRecentLogs(int limit) {
        int cappedLimit = Math.max(1, Math.min(limit, 500));
        return jdbcTemplate.query("""
                        SELECT
                            l.id,
                            l.sid,
                            l.user_id,
                            u.username,
                            l.login_identifier_masked,
                            l.login_identifier_type,
                            l.event_type,
                            l.result,
                            l.reason,
                            l.client_ip,
                            l.user_agent,
                            l.created_at
                        FROM auth_login_log l
                        LEFT JOIN user_account u ON u.id = l.user_id
                        ORDER BY l.created_at DESC, l.id DESC
                        LIMIT ?
                        """,
                (rs, rowNum) -> new LoginLog(
                        rs.getLong("id"),
                        rs.getString("sid"),
                        rs.getObject("user_id", Long.class),
                        rs.getString("username"),
                        rs.getString("login_identifier_masked"),
                        rs.getString("login_identifier_type"),
                        rs.getString("event_type"),
                        rs.getString("result"),
                        rs.getString("reason"),
                        rs.getString("client_ip"),
                        rs.getString("user_agent"),
                        rs.getTimestamp("created_at").toLocalDateTime()),
                cappedLimit);
    }

    public String maskIdentifier(String identifier, String identifierType) {
        if (!StringUtils.hasText(identifier)) {
            return "***";
        }
        String value = identifier.trim();
        if ("MOBILE".equalsIgnoreCase(identifierType)) {
            return value.length() <= 7 ? "***" : value.substring(0, 3) + "****" + value.substring(value.length() - 4);
        }
        if ("EMAIL".equalsIgnoreCase(identifierType)) {
            int atIndex = value.indexOf('@');
            if (atIndex <= 1) {
                return "***" + value.substring(Math.max(atIndex, 0));
            }
            String localPart = value.substring(0, atIndex);
            return localPart.charAt(0) + "***" + localPart.charAt(localPart.length() - 1) + value.substring(atIndex);
        }
        return value.length() <= 2 ? "***" : value.charAt(0) + "***" + value.charAt(value.length() - 1);
    }

    public LoginLogCommand loginFailure(String sid, Long userId, String username, String identifierType, String identifier,
                                        String reason, String clientIp, String userAgent) {
        return new LoginLogCommand(
                sid,
                userId,
                username,
                maskIdentifier(identifier, identifierType),
                identifierType,
                "LOGIN",
                "FAILURE",
                reason,
                clientIp,
                userAgent);
    }

    public LoginLogCommand loginSuccess(String sid, Long userId, String username, String identifierType, String identifier,
                                        String clientIp, String userAgent) {
        return new LoginLogCommand(
                sid,
                userId,
                username,
                maskIdentifier(identifier, identifierType),
                identifierType,
                "LOGIN",
                "SUCCESS",
                null,
                clientIp,
                userAgent);
    }

    public LoginLogCommand sessionEvent(String sid, Long userId, String username, String identifierType, String identifier,
                                        String eventType, String result, String reason, String clientIp, String userAgent) {
        return new LoginLogCommand(
                sid,
                userId,
                username,
                maskIdentifier(identifier, identifierType),
                identifierType,
                eventType,
                result,
                reason,
                clientIp,
                userAgent);
    }

    public record LoginLogCommand(
            String sid,
            Long userId,
            String username,
            String loginIdentifierMasked,
            String loginIdentifierType,
            String eventType,
            String result,
            String reason,
            String clientIp,
            String userAgent) {
    }

    public record LoginLog(
            long id,
            String sid,
            Long userId,
            String username,
            String loginIdentifierMasked,
            String loginIdentifierType,
            String eventType,
            String result,
            String reason,
            String clientIp,
            String userAgent,
            LocalDateTime createdAt) {
    }
}
