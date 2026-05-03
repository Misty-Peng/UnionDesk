package com.uniondesk.notification.core;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.argThat;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;

import com.fasterxml.jackson.databind.ObjectMapper;
import java.time.Clock;
import java.time.Instant;
import java.time.ZoneOffset;
import java.util.concurrent.atomic.AtomicLong;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;
import org.springframework.jdbc.core.JdbcTemplate;

@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
class NotificationCenterServiceTests {

    private static final Clock CLOCK = Clock.fixed(Instant.parse("2026-05-03T08:00:00Z"), ZoneOffset.UTC);

    @Mock
    private JdbcTemplate jdbcTemplate;

    private final AtomicLong notificationLogSequence = new AtomicLong();
    private final AtomicLong inboxMessageSequence = new AtomicLong();
    private final AtomicLong unreadMessageCount = new AtomicLong();

    private NotificationCenterService notificationCenterService;

    @BeforeEach
    void setUp() {
        notificationCenterService = new NotificationCenterService(jdbcTemplate, new ObjectMapper(), CLOCK, false);
        stubIdentityLookups();
        stubPersistence();
    }

    @Test
    void notifyTicketCreatedCreatesUnreadInboxMessageAndUnreadCount() {
        NotificationCenterService.NotificationDispatchResult result =
                notificationCenterService.notifyTicketCreated(1L, 101L, 1001L, 2002L);

        assertThat(result.status()).isEqualTo("degraded");
        assertThat(result.notificationLogId()).isEqualTo(1L);
        assertThat(result.inboxMessageId()).isEqualTo(1L);
        assertThat(notificationCenterService.unreadCount(1001L)).isEqualTo(1L);

        assertThat(notificationCenterService.markRead(1001L, result.inboxMessageId())).isEqualTo(1);
        unreadMessageCount.set(0L);
        assertThat(notificationCenterService.unreadCount(1001L)).isEqualTo(0L);
    }

    private void stubIdentityLookups() {
        when(jdbcTemplate.queryForObject(argThat(sql -> sql != null && sql.contains("FROM identity_subject")), eq(Long.class), any(Object[].class)))
                .thenReturn(null);
        when(jdbcTemplate.queryForObject(argThat(sql -> sql != null && sql.contains("FROM user_account")), eq(String.class), any(Object[].class)))
                .thenReturn(null);
    }

    private void stubPersistence() {
        when(jdbcTemplate.update(argThat(sql -> sql != null && sql.contains("INSERT INTO identity_subject")), any(Object[].class)))
                .thenReturn(1);
        when(jdbcTemplate.update(argThat(sql -> sql != null && sql.contains("INSERT INTO notification_log")), any(Object[].class)))
                .thenAnswer(invocation -> {
                    notificationLogSequence.incrementAndGet();
                    return 1;
                });
        when(jdbcTemplate.update(argThat(sql -> sql != null && sql.contains("INSERT INTO inbox_message")), any(Object[].class)))
                .thenAnswer(invocation -> {
                    inboxMessageSequence.incrementAndGet();
                    unreadMessageCount.incrementAndGet();
                    return 1;
                });
        when(jdbcTemplate.update(argThat(sql -> sql != null && sql.contains("UPDATE inbox_message")), any(Object[].class)))
                .thenAnswer(invocation -> {
                    unreadMessageCount.set(0L);
                    return 1;
                });
        when(jdbcTemplate.update(argThat(sql -> sql != null && sql.contains("INSERT INTO audit_log")), any(Object[].class)))
                .thenReturn(1);
        when(jdbcTemplate.queryForObject(argThat(sql -> sql != null && sql.contains("FROM notification_log")), eq(Long.class), any(Object[].class)))
                .thenAnswer(invocation -> notificationLogSequence.get());
        when(jdbcTemplate.queryForObject(argThat(sql -> sql != null && sql.contains("FROM inbox_message") && sql.contains("notification_log_id")), eq(Long.class), any(Object[].class)))
                .thenAnswer(invocation -> inboxMessageSequence.get());
        when(jdbcTemplate.queryForObject(argThat(sql -> sql != null && sql.contains("SELECT COUNT(*)") && sql.contains("FROM inbox_message")), eq(Long.class), any(Object[].class)))
                .thenAnswer(invocation -> unreadMessageCount.get());
    }
}
