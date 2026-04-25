package com.uniondesk.auth.core;

import java.util.Optional;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

@Service
public class AuthClientService {

    private final JdbcTemplate jdbcTemplate;

    public AuthClientService(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    public Optional<AuthClient> findByCode(String clientCode) {
        if (!StringUtils.hasText(clientCode)) {
            return Optional.empty();
        }
        return jdbcTemplate.query("""
                        SELECT client_code, allowed_account_type, status
                        FROM auth_client
                        WHERE client_code = ?
                        LIMIT 1
                        """,
                (rs, rowNum) -> new AuthClient(
                        rs.getString("client_code"),
                        rs.getString("allowed_account_type"),
                        rs.getInt("status")),
                clientCode.trim()).stream().findFirst();
    }

    public record AuthClient(String clientCode, String allowedAccountType, int status) {
    }
}
