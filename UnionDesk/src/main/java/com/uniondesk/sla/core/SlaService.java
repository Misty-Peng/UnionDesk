package com.uniondesk.sla.core;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.time.Clock;
import java.time.LocalDateTime;
import java.time.ZoneOffset;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class SlaService {

    private final JdbcTemplate jdbcTemplate;
    private final Clock clock;
    private final ObjectMapper objectMapper;

    public SlaService(JdbcTemplate jdbcTemplate, Clock clock, ObjectMapper objectMapper) {
        this.jdbcTemplate = jdbcTemplate;
        this.clock = clock;
        this.objectMapper = objectMapper;
    }

    @Transactional
    public void applyOnCreate(long businessDomainId, long ticketId, long ticketTypeId) {
        TicketSlaPolicy policy = loadPolicy(businessDomainId, ticketTypeId);
        LocalDateTime createdAt = loadTicketCreatedAt(ticketId);
        LocalDateTime firstResponseDeadline = policy.firstResponseMinutes() == null
                ? null
                : createdAt.plusMinutes(policy.firstResponseMinutes());
        LocalDateTime resolutionDeadline = policy.resolutionMinutes() == null
                ? null
                : createdAt.plusMinutes(policy.resolutionMinutes());
        jdbcTemplate.update("""
                        UPDATE ticket
                        SET sla_first_response_deadline = ?,
                            sla_resolution_deadline = ?,
                            sla_status = 'tracking',
                            sla_paused_duration = COALESCE(sla_paused_duration, 0),
                            sla_pause_started_at = NULL
                        WHERE id = ?
                        """,
                firstResponseDeadline,
                resolutionDeadline,
                ticketId);
    }

    @Transactional
    public void recordFirstResponse(long businessDomainId, long ticketId) {
        LocalDateTime now = LocalDateTime.now(clock);
        jdbcTemplate.update("""
                        UPDATE ticket
                        SET sla_first_responded_at = COALESCE(sla_first_responded_at, ?),
                            sla_status = COALESCE(sla_status, 'tracking')
                        WHERE id = ? AND business_domain_id = ?
                        """,
                now,
                ticketId,
                businessDomainId);
    }

    @Transactional
    public void recordResolution(long businessDomainId, long ticketId) {
        LocalDateTime now = LocalDateTime.now(clock);
        jdbcTemplate.update("""
                        UPDATE ticket
                        SET sla_resolved_at = COALESCE(sla_resolved_at, ?),
                            sla_status = 'resolved'
                        WHERE id = ? AND business_domain_id = ?
                        """,
                now,
                ticketId,
                businessDomainId);
    }

    @Transactional
    public SlaBreachDecision evaluateTicket(long businessDomainId, long ticketId) {
        TicketSlaSnapshot snapshot = loadSnapshot(businessDomainId, ticketId);
        LocalDateTime now = LocalDateTime.now(clock);
        boolean firstResponseBreached = snapshot.firstResponseDeadline() != null
                && snapshot.firstResponseRespondedAt() == null
                && now.isAfter(snapshot.firstResponseDeadline());
        boolean resolutionBreached = snapshot.resolutionDeadline() != null
                && snapshot.resolvedAt() == null
                && now.isAfter(snapshot.resolutionDeadline());
        if (!firstResponseBreached && !resolutionBreached) {
            return new SlaBreachDecision(false, false, snapshot.priority(), snapshot.slaStatus());
        }

        String nextPriority = snapshot.priority();
        String nextStatus = "breached";
        Map<String, Object> breachAction = snapshot.breachActionJson() == null
                ? Map.of()
                : parseMap(snapshot.breachActionJson());

        if (firstResponseBreached || resolutionBreached) {
            Object priorityValue = breachAction.get("raise_priority_to");
            if (priorityValue != null && String.valueOf(priorityValue).isBlank() == false) {
                nextPriority = String.valueOf(priorityValue);
            }
            Object statusValue = breachAction.get("sla_status");
            if (statusValue != null && String.valueOf(statusValue).isBlank() == false) {
                nextStatus = String.valueOf(statusValue);
            }
        }

        jdbcTemplate.update("""
                        UPDATE ticket
                        SET priority = ?,
                            sla_status = ?,
                            updated_at = CURRENT_TIMESTAMP(3)
                        WHERE id = ?
                        """,
                nextPriority,
                nextStatus,
                ticketId);

        return new SlaBreachDecision(true, firstResponseBreached, nextPriority, nextStatus);
    }

    private TicketSlaPolicy loadPolicy(long businessDomainId, long ticketTypeId) {
        TicketSlaPolicy typePolicy = jdbcTemplate.query("""
                        SELECT
                            tt.sla_first_response_minutes,
                            tt.sla_resolve_minutes,
                            sr.breach_action_json
                        FROM ticket_type tt
                        LEFT JOIN sla_rule sr
                          ON sr.business_domain_id = tt.business_domain_id
                         AND (sr.ticket_type_id = tt.id OR sr.ticket_type_id IS NULL)
                        WHERE tt.id = ? AND tt.business_domain_id = ?
                        ORDER BY sr.ticket_type_id IS NOT NULL DESC, sr.id DESC
                        LIMIT 1
                        """,
                (rs, rowNum) -> new TicketSlaPolicy(
                        getInteger(rs, "sla_first_response_minutes"),
                        getInteger(rs, "sla_resolve_minutes"),
                        rs.getString("breach_action_json")),
                ticketTypeId,
                businessDomainId).stream().findFirst().orElse(null);
        if (typePolicy != null) {
            return typePolicy;
        }
        return new TicketSlaPolicy(null, null, null);
    }

    private TicketSlaSnapshot loadSnapshot(long businessDomainId, long ticketId) {
        return jdbcTemplate.queryForObject("""
                        SELECT
                            t.priority,
                            t.sla_status,
                            t.sla_first_response_deadline,
                            t.sla_resolution_deadline,
                            t.sla_first_responded_at,
                            t.sla_resolved_at,
                            sr.breach_action_json
                        FROM ticket t
                        LEFT JOIN sla_rule sr
                          ON sr.business_domain_id = t.business_domain_id
                         AND (sr.ticket_type_id = t.ticket_type_id OR sr.ticket_type_id IS NULL)
                        WHERE t.id = ? AND t.business_domain_id = ?
                        ORDER BY sr.ticket_type_id IS NOT NULL DESC, sr.id DESC
                        LIMIT 1
                        """,
                (rs, rowNum) -> new TicketSlaSnapshot(
                        rs.getString("priority"),
                        rs.getString("sla_status"),
                        toLocalDateTime(rs.getTimestamp("sla_first_response_deadline")),
                        toLocalDateTime(rs.getTimestamp("sla_resolution_deadline")),
                        toLocalDateTime(rs.getTimestamp("sla_first_responded_at")),
                        toLocalDateTime(rs.getTimestamp("sla_resolved_at")),
                        rs.getString("breach_action_json")),
                ticketId,
                businessDomainId);
    }

    private LocalDateTime loadTicketCreatedAt(long ticketId) {
        LocalDateTime createdAt = jdbcTemplate.queryForObject("""
                        SELECT created_at
                        FROM ticket
                        WHERE id = ?
                        LIMIT 1
                        """,
                (rs, rowNum) -> toLocalDateTime(rs.getTimestamp("created_at")),
                ticketId);
        if (createdAt == null) {
            return LocalDateTime.now(clock);
        }
        return createdAt;
    }

    private Map<String, Object> parseMap(String json) {
        try {
            @SuppressWarnings("unchecked")
            Map<String, Object> map = objectMapper.readValue(json, Map.class);
            return new LinkedHashMap<>(map);
        } catch (Exception ex) {
            return Map.of();
        }
    }

    private Integer getInteger(java.sql.ResultSet rs, String column) throws java.sql.SQLException {
        int value = rs.getInt(column);
        return rs.wasNull() ? null : value;
    }

    private LocalDateTime toLocalDateTime(java.sql.Timestamp timestamp) {
        return timestamp == null ? null : timestamp.toLocalDateTime();
    }

    public record SlaBreachDecision(
            boolean breached,
            boolean firstResponseBreached,
            String nextPriority,
            String nextStatus) {
    }

    private record TicketSlaPolicy(Integer firstResponseMinutes, Integer resolutionMinutes, String breachActionJson) {
    }

    private record TicketSlaSnapshot(
            String priority,
            String slaStatus,
            LocalDateTime firstResponseDeadline,
            LocalDateTime resolutionDeadline,
            LocalDateTime firstResponseRespondedAt,
            LocalDateTime resolvedAt,
            String breachActionJson) {
    }
}
