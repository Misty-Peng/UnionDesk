package com.uniondesk.iam.core;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.argThat;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.uniondesk.iam.admin.AdminMenuService;
import java.sql.ResultSet;
import java.time.Clock;
import java.util.ArrayList;
import java.util.List;
import org.junit.jupiter.api.Test;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.security.crypto.password.PasswordEncoder;

class IamServiceTests {

    @Test
    void listUsersLoadsRoleCodesWithMysqlCompatibleDistinctOrdering() throws Exception {
        JdbcTemplate jdbcTemplate = mock(JdbcTemplate.class);
        IamService service = new IamService(
                jdbcTemplate,
                Clock.systemUTC(),
                mock(PasswordEncoder.class),
                mock(AdminMenuService.class),
                new PermissionScopePolicy());

        when(jdbcTemplate.query(
                org.mockito.ArgumentMatchers.<String>argThat(sql -> sql.contains("FROM user_account")),
                org.mockito.ArgumentMatchers.<RowMapper<IamService.UserAccount>>any()))
                .thenAnswer(invocation -> {
                    RowMapper<IamService.UserAccount> mapper = invocation.getArgument(1);
                    ResultSet rs = mock(ResultSet.class);
                    when(rs.getLong("id")).thenReturn(42L);
                    when(rs.getString("username")).thenReturn("admin");
                    when(rs.getString("mobile")).thenReturn("13800000000");
                    when(rs.getString("email")).thenReturn("admin@example.com");
                    when(rs.getString("account_type")).thenReturn("admin");
                    when(rs.getInt("status")).thenReturn(1);
                    when(rs.getString("employment_status")).thenReturn("active");
                    when(rs.getTimestamp("offboarded_at")).thenReturn(null);
                    when(rs.getObject("offboarded_by", Long.class)).thenReturn(null);
                    when(rs.getString("offboard_reason")).thenReturn(null);
                    return List.of(mapper.mapRow(rs, 0));
                });
        when(jdbcTemplate.query(
                org.mockito.ArgumentMatchers.<String>argThat(sql -> sql.contains("SELECT DISTINCT")
                        && sql.contains("role_order")
                        && sql.contains("ORDER BY role_order")),
                org.mockito.ArgumentMatchers.<RowMapper<String>>any(),
                eq(42L),
                eq(42L)))
                .thenAnswer(invocation -> {
                    RowMapper<String> mapper = invocation.getArgument(1);
                    ResultSet rs = mock(ResultSet.class);
                    when(rs.getString("code")).thenReturn("super_admin");
                    when(rs.getString("role_code")).thenReturn("super_admin");
                    return new ArrayList<>(List.of(mapper.mapRow(rs, 0)));
                });
        when(jdbcTemplate.queryForList(anyString(), eq(Long.class), eq(42L))).thenReturn(List.of(7L));

        List<IamService.UserAccount> users = service.listUsers(false);

        assertThat(users).singleElement().satisfies(user -> {
            assertThat(user.roleCodes()).containsExactly("super_admin");
            assertThat(user.businessDomainIds()).containsExactly(7L);
        });
        verify(jdbcTemplate).query(
                org.mockito.ArgumentMatchers.<String>argThat(sql -> sql.contains("SELECT DISTINCT")
                        && sql.contains("role_order")
                        && sql.contains("ORDER BY role_order")),
                org.mockito.ArgumentMatchers.<RowMapper<String>>any(),
                eq(42L),
                eq(42L));
    }
}
