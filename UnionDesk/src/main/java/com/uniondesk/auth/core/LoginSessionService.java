package com.uniondesk.auth.core;

import java.time.Clock;
import java.time.LocalDateTime;
import java.util.List;
import org.springframework.dao.EmptyResultDataAccessException;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

@Service
public class LoginSessionService {

    private final JdbcTemplate jdbcTemplate;
    private final Clock clock;

    public LoginSessionService(JdbcTemplate jdbcTemplate, Clock clock) {
        this.jdbcTemplate = jdbcTemplate;
        this.clock = clock;
    }

    public String createSession(CreateSessionCommand command) {
        LocalDateTime now = LocalDateTime.now(clock);
        jdbcTemplate.update("""
                        INSERT INTO auth_login_session (
                            sid, user_id, client_code, role_code, business_domain_id, login_identifier_masked,
                            session_status, issued_at, expires_at, last_seen_at,
                            refresh_token_hash, client_ip, user_agent
                        )
                        VALUES (?, ?, ?, ?, ?, ?, 'active', ?, ?, ?, ?, ?, ?)
                        """,
                command.sid(),
                command.userId(),
                command.clientCode(),
                command.roleCode(),
                command.businessDomainId(),
                command.loginIdentifierMasked(),
                now,
                command.expiresAt(),
                now,
                command.refreshTokenHash(),
                command.clientIp(),
                command.userAgent());
        return command.sid();
    }

    public boolean validateAndTouch(String sid, String clientCode) {
        if (!StringUtils.hasText(sid)) {
            return false;
        }
        if (!StringUtils.hasText(clientCode)) {
            return false;
        }
        try {
            SessionState state = jdbcTemplate.queryForObject("""
                            SELECT session_status, expires_at, client_code
                            FROM auth_login_session
                            WHERE sid = ?
                            """,
                    (rs, rowNum) -> new SessionState(
                            rs.getString("session_status"),
                            rs.getTimestamp("expires_at").toLocalDateTime(),
                            rs.getString("client_code")),
                    sid);
            if (state == null) {
                return false;
            }
            LocalDateTime now = LocalDateTime.now(clock);
            if (!clientCode.equalsIgnoreCase(state.clientCode())) {
                return false;
            }
            if (!"active".equalsIgnoreCase(state.sessionStatus())) {
                return false;
            }
            if (!state.expiresAt().isAfter(now)) {
                jdbcTemplate.update("""
                                UPDATE auth_login_session
                                SET session_status = 'expired',
                                    revoked_at = ?,
                                    revoked_reason = 'expired'
                                WHERE sid = ? AND session_status = 'active'
                                """, now, sid);
                return false;
            }
            jdbcTemplate.update("""
                            UPDATE auth_login_session
                            SET last_seen_at = ?
                            WHERE sid = ? AND session_status = 'active'
                            """, now, sid);
            return true;
        } catch (EmptyResultDataAccessException ex) {
            return false;
        }
    }

    public boolean validateAndTouch(String sid) {
        if (!StringUtils.hasText(sid)) {
            return false;
        }
        try {
            SessionState state = jdbcTemplate.queryForObject("""
                            SELECT session_status, expires_at, client_code
                            FROM auth_login_session
                            WHERE sid = ?
                            """,
                    (rs, rowNum) -> new SessionState(
                            rs.getString("session_status"),
                            rs.getTimestamp("expires_at").toLocalDateTime(),
                            rs.getString("client_code")),
                    sid);
            if (state == null) {
                return false;
            }
            LocalDateTime now = LocalDateTime.now(clock);
            if (!"active".equalsIgnoreCase(state.sessionStatus())) {
                return false;
            }
            if (!state.expiresAt().isAfter(now)) {
                jdbcTemplate.update("""
                                UPDATE auth_login_session
                                SET session_status = 'expired',
                                    revoked_at = ?,
                                    revoked_reason = 'expired'
                                WHERE sid = ? AND session_status = 'active'
                                """, now, sid);
                return false;
            }
            jdbcTemplate.update("""
                            UPDATE auth_login_session
                            SET last_seen_at = ?
                            WHERE sid = ? AND session_status = 'active'
                            """, now, sid);
            return true;
        } catch (EmptyResultDataAccessException ex) {
            return false;
        }
    }

    public int revokeSession(String sid, String reason) {
        LocalDateTime now = LocalDateTime.now(clock);
        return jdbcTemplate.update("""
                        UPDATE auth_login_session
                        SET session_status = 'revoked',
                            revoked_at = ?,
                            revoked_reason = ?
                        WHERE sid = ? AND session_status = 'active'
                        """,
                now,
                reason,
                sid);
    }

    public int revokeSessionsByUser(long userId, String reason) {
        LocalDateTime now = LocalDateTime.now(clock);
        return jdbcTemplate.update("""
                        UPDATE auth_login_session
                        SET session_status = 'revoked',
                            revoked_at = ?,
                            revoked_reason = ?
                        WHERE user_id = ? AND session_status = 'active'
                        """,
                now,
                reason,
                userId);
    }

    public List<OnlineSession> listOnlineSessions(int limit) {
        int cappedLimit = Math.max(1, Math.min(limit, 500));
        return jdbcTemplate.query("""
                        SELECT
                            s.sid,
                            s.user_id,
                            s.client_code,
                            u.username,
                            u.mobile,
                            u.email,
                            s.role_code,
                            s.business_domain_id,
                            s.login_identifier_masked,
                            s.session_status,
                            s.issued_at,
                            s.expires_at,
                            s.last_seen_at,
                            s.client_ip,
                            s.user_agent
                        FROM auth_login_session s
                        JOIN user_account u ON u.id = s.user_id
                        WHERE s.session_status = 'active'
                          AND s.expires_at > CURRENT_TIMESTAMP(3)
                        ORDER BY COALESCE(s.last_seen_at, s.issued_at) DESC, s.issued_at DESC
                        LIMIT ?
                        """,
                (rs, rowNum) -> new OnlineSession(
                        rs.getString("sid"),
                        rs.getLong("user_id"),
                        rs.getString("client_code"),
                        rs.getString("username"),
                        rs.getString("mobile"),
                        rs.getString("email"),
                        rs.getString("role_code"),
                        rs.getObject("business_domain_id", Long.class),
                        rs.getString("login_identifier_masked"),
                        rs.getString("session_status"),
                        toLocalDateTime(rs.getTimestamp("issued_at")),
                        toLocalDateTime(rs.getTimestamp("expires_at")),
                        toLocalDateTime(rs.getTimestamp("last_seen_at")),
                        rs.getString("client_ip"),
                        rs.getString("user_agent")),
                cappedLimit);
    }

    private LocalDateTime toLocalDateTime(java.sql.Timestamp timestamp) {
        return timestamp == null ? null : timestamp.toLocalDateTime();
    }

    private record SessionState(String sessionStatus, LocalDateTime expiresAt, String clientCode) {
    }

    public record CreateSessionCommand(
            String sid,
            long userId,
            String clientCode,
            String roleCode,
            Long businessDomainId,
            String loginIdentifierMasked,
            LocalDateTime expiresAt,
            String refreshTokenHash,
            String clientIp,
            String userAgent) {
    }

    public record OnlineSession(
            String sid,
            long userId,
            String clientCode,
            String username,
            String mobile,
            String email,
            String roleCode,
            Long businessDomainId,
            String loginIdentifierMasked,
            String sessionStatus,
            LocalDateTime issuedAt,
            LocalDateTime expiresAt,
            LocalDateTime lastSeenAt,
            String clientIp,
            String userAgent) {
    }
}
