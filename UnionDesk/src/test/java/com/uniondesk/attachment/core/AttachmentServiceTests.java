package com.uniondesk.attachment.core;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.argThat;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.time.Clock;
import java.time.Instant;
import java.time.ZoneOffset;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.junit.jupiter.api.io.TempDir;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;
import org.springframework.dao.EmptyResultDataAccessException;
import org.springframework.jdbc.core.JdbcTemplate;

@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
class AttachmentServiceTests {

    private static final Clock CLOCK = Clock.fixed(Instant.parse("2026-05-03T08:00:00Z"), ZoneOffset.UTC);

    @Mock
    private JdbcTemplate jdbcTemplate;

    @TempDir
    Path tempDir;

    private String originalTmpDir;
    private AttachmentService attachmentService;

    @BeforeEach
    void setUp() {
        originalTmpDir = System.getProperty("java.io.tmpdir");
        System.setProperty("java.io.tmpdir", tempDir.toString());
        attachmentService = new AttachmentService(jdbcTemplate, CLOCK);
        stubDefaultPolicyFallback();
        stubAttachmentPersistence();
    }

    @AfterEach
    void tearDown() {
        if (originalTmpDir == null) {
            System.clearProperty("java.io.tmpdir");
        } else {
            System.setProperty("java.io.tmpdir", originalTmpDir);
        }
    }

    @Test
    void uploadAttachmentFallsBackToLocalStorageAndWritesFile() throws IOException, NoSuchAlgorithmException {
        byte[] content = "hello".getBytes(StandardCharsets.UTF_8);

        AttachmentService.AttachmentUploadResult result = attachmentService.uploadAttachment(
                null,
                new AttachmentService.UploadAttachmentCommand(
                        1L,
                        "customer",
                        "note.txt",
                        "text/plain",
                        content,
                        null,
                        null,
                        null));

        assertThat(result.storageType()).isEqualTo("local");
        Path localFile = Path.of(result.localPath());
        assertThat(Files.exists(localFile)).isTrue();
        assertThat(Files.readAllBytes(localFile)).containsExactly(content);
        assertThat(result.checksum()).isEqualTo(sha256(content));
    }

    @Test
    void uploadAttachmentRejectsDisallowedExtension() {
        assertThatThrownBy(() -> attachmentService.uploadAttachment(
                null,
                new AttachmentService.UploadAttachmentCommand(
                        1L,
                        "customer",
                        "virus.exe",
                        "application/octet-stream",
                        new byte[] {1, 2, 3},
                        null,
                        null,
                        null)))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("白名单");
    }

    @Test
    void uploadAttachmentRejectsOversizedFile() {
        byte[] content = new byte[20 * 1024 * 1024 + 1];

        assertThatThrownBy(() -> attachmentService.uploadAttachment(
                null,
                new AttachmentService.UploadAttachmentCommand(
                        1L,
                        "customer",
                        "big.pdf",
                        "application/pdf",
                        content,
                        null,
                        null,
                        null)))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("大小超限");
    }

    private void stubDefaultPolicyFallback() {
        when(jdbcTemplate.queryForObject(
                argThat(sql -> sql != null && sql.contains("FROM attachment_policy")),
                any(org.springframework.jdbc.core.RowMapper.class),
                any(Object[].class)))
                .thenThrow(new EmptyResultDataAccessException(1));
    }

    private void stubAttachmentPersistence() {
        when(jdbcTemplate.update(argThat(sql -> sql != null && sql.contains("INSERT INTO file_attachment")), any(Object[].class)))
                .thenReturn(1);
        when(jdbcTemplate.queryForObject(argThat(sql -> sql != null && sql.contains("FROM file_attachment") && sql.contains("storage_key")), eq(Long.class), any()))
                .thenReturn(77L);
    }

    private static String sha256(byte[] content) throws NoSuchAlgorithmException {
        MessageDigest digest = MessageDigest.getInstance("SHA-256");
        return java.util.HexFormat.of().formatHex(digest.digest(content));
    }
}
