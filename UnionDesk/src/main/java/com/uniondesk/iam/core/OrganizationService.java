package com.uniondesk.iam.core;

import java.util.List;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;

@Service
public class OrganizationService {

    private final JdbcTemplate jdbcTemplate;

    public OrganizationService(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    public List<OrganizationUnit> listOrganizations() {
        return jdbcTemplate.query("""
                SELECT o.id,
                       o.code,
                       o.name,
                       o.parent_id,
                       parent.name AS parent_name,
                       o.leader_user_id,
                       COALESCE(NULLIF(leader.nickname, ''), leader.username) AS leader_name,
                       o.order_no,
                       o.status,
                       o.remark
                FROM platform_organization o
                LEFT JOIN platform_organization parent ON parent.id = o.parent_id
                LEFT JOIN user_account leader ON leader.id = o.leader_user_id
                ORDER BY COALESCE(o.parent_id, 0), o.order_no, o.id
                """, (rs, rowNum) -> new OrganizationUnit(
                rs.getLong("id"),
                rs.getString("code"),
                rs.getString("name"),
                rs.getObject("parent_id", Long.class),
                rs.getString("parent_name"),
                rs.getObject("leader_user_id", Long.class),
                rs.getString("leader_name"),
                rs.getInt("order_no"),
                rs.getInt("status"),
                rs.getString("remark")));
    }

    public record OrganizationUnit(
            long id,
            String code,
            String name,
            Long parentId,
            String parentName,
            Long leaderUserId,
            String leaderName,
            int orderNo,
            int status,
            String remark) {
    }
}
