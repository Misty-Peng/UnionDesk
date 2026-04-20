package com.uniondesk.ticket.web;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/tickets")
public class TicketController {

    private final JdbcTemplate jdbcTemplate;

    public TicketController(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    @GetMapping
    public List<TicketItem> list() {
        return jdbcTemplate.query("""
                        SELECT id, ticket_no, title, status, created_at
                        FROM ticket
                        ORDER BY created_at DESC, id DESC
                        """,
                ticketRowMapper());
    }

    @GetMapping("/{id}")
    public TicketItem detail(@PathVariable long id) {
        return jdbcTemplate.query("""
                        SELECT id, ticket_no, title, status, created_at
                        FROM ticket
                        WHERE id = ?
                        """,
                ticketRowMapper(), id)
                .stream()
                .findFirst()
                .orElseThrow(() -> new IllegalArgumentException("ticket not found"));
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public TicketItem create(@RequestBody CreateTicketRequest request) {
        Long domainId = jdbcTemplate.queryForObject("SELECT id FROM business_domain WHERE code = 'default' LIMIT 1", Long.class);
        Long ticketTypeId = request.ticketTypeId();
        Long customerId = 1L;
        String ticketNo = "T" + System.currentTimeMillis();

        jdbcTemplate.update("""
                        INSERT INTO ticket (ticket_no, business_domain_id, customer_id, ticket_type_id, title, description, status, priority, source)
                        VALUES (?, ?, ?, ?, ?, ?, 'open', 'normal', 'web')
                        """,
                ticketNo, domainId, customerId, ticketTypeId, request.title(), request.description());

        return jdbcTemplate.query("""
                        SELECT id, ticket_no, title, status, created_at
                        FROM ticket
                        WHERE ticket_no = ?
                        """,
                ticketRowMapper(), ticketNo)
                .stream()
                .findFirst()
                .orElseThrow(() -> new IllegalStateException("created ticket not found"));
    }

    @PostMapping("/{id}/processing")
    public Map<String, Object> markProcessing(@PathVariable long id) {
        return updateStatus(id, "processing");
    }

    @PostMapping("/{id}/resolved")
    public Map<String, Object> markResolved(@PathVariable long id) {
        return updateStatus(id, "resolved");
    }

    private Map<String, Object> updateStatus(long id, String status) {
        int updated = jdbcTemplate.update("UPDATE ticket SET status = ? WHERE id = ?", status, id);
        if (updated == 0) {
            throw new IllegalArgumentException("ticket not found");
        }
        return Map.of("ok", true, "status", status);
    }

    private RowMapper<TicketItem> ticketRowMapper() {
        return new RowMapper<>() {
            @Override
            public TicketItem mapRow(ResultSet rs, int rowNum) throws SQLException {
                return new TicketItem(
                        rs.getLong("id"),
                        rs.getString("ticket_no"),
                        rs.getString("title"),
                        rs.getString("status"),
                        rs.getTimestamp("created_at").toLocalDateTime());
            }
        };
    }

    public record CreateTicketRequest(@NotBlank String title, @NotBlank String description, @NotNull Long ticketTypeId) {}
    public record TicketItem(long id, String ticketNo, String title, String status, LocalDateTime createdAt) {}
}
