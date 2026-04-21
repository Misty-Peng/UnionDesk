package com.uniondesk.auth.core;

import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Optional;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;

@Service
public class LoginAccountService {

    private final JdbcTemplate jdbcTemplate;

    public LoginAccountService(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    public Optional<LoginAccount> findByIdentifier(String identifier, LoginIdentifierType type) {
        String sql = switch (type) {
            case USERNAME -> """
                    SELECT id, username, mobile, email, password_hash, status
                    FROM user_account
                    WHERE LOWER(username) = LOWER(?)
                    LIMIT 1
                    """;
            case EMAIL -> """
                    SELECT id, username, mobile, email, password_hash, status
                    FROM user_account
                    WHERE LOWER(email) = LOWER(?)
                    LIMIT 1
                    """;
            case MOBILE -> """
                    SELECT id, username, mobile, email, password_hash, status
                    FROM user_account
                    WHERE mobile = ?
                    LIMIT 1
                    """;
        };
        return jdbcTemplate.query(sql, (rs, rowNum) -> new LoginAccount(
                rs.getLong("id"),
                rs.getString("username"),
                rs.getString("mobile"),
                rs.getString("email"),
                rs.getString("password_hash"),
                rs.getInt("status")), identifier.trim()).stream().findFirst();
    }

    public Optional<LoginAccount> findById(long userId) {
        return jdbcTemplate.query("""
                        SELECT id, username, mobile, email, password_hash, status
                        FROM user_account
                        WHERE id = ?
                        LIMIT 1
                        """,
                (rs, rowNum) -> new LoginAccount(
                        rs.getLong("id"),
                        rs.getString("username"),
                        rs.getString("mobile"),
                        rs.getString("email"),
                        rs.getString("password_hash"),
                        rs.getInt("status")),
                userId).stream().findFirst();
    }

    public List<String> loadRoleCodes(long userId) {
        List<String> roles = new ArrayList<>(jdbcTemplate.query("""
                        SELECT DISTINCT role_code
                        FROM (
                            SELECT r.code AS role_code
                            FROM role r
                            JOIN user_global_role ugr ON ugr.role_id = r.id
                            WHERE ugr.user_id = ?
                            UNION
                            SELECT r.code AS role_code
                            FROM role r
                            JOIN user_domain_role udr ON udr.role_id = r.id
                            WHERE udr.user_id = ?
                        ) roles
                        """,
                (rs, rowNum) -> rs.getString("role_code"),
                userId,
                userId));
        roles.sort(Comparator.comparingInt(LoginAccountService::rolePriority));
        return List.copyOf(roles);
    }

    public List<Long> loadAccessibleDomainIds(long userId, List<String> roleCodes) {
        if (roleCodes.contains("super_admin")) {
            return jdbcTemplate.queryForList("SELECT id FROM business_domain ORDER BY id", Long.class);
        }
        return jdbcTemplate.queryForList("""
                        SELECT DISTINCT business_domain_id
                        FROM user_domain_role
                        WHERE user_id = ?
                        ORDER BY business_domain_id
                        """, Long.class, userId);
    }

    private static int rolePriority(String role) {
        return switch (role) {
            case "super_admin" -> 0;
            case "domain_admin" -> 1;
            case "agent" -> 2;
            case "customer" -> 3;
            default -> 10;
        };
    }

    public record LoginAccount(long id, String username, String mobile, String email, String passwordHash, int status) {
    }
}
