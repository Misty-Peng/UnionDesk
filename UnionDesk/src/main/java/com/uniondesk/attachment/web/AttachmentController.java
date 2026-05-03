package com.uniondesk.attachment.web;

import com.uniondesk.auth.core.UserContextHolder;
import com.uniondesk.attachment.core.AttachmentService;
import com.uniondesk.iam.core.PermissionCodes;
import com.uniondesk.iam.core.RequirePermission;
import java.nio.charset.StandardCharsets;
import org.springframework.http.ContentDisposition;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/api/v1/attachments")
public class AttachmentController {

    private final AttachmentService attachmentService;

    public AttachmentController(AttachmentService attachmentService) {
        this.attachmentService = attachmentService;
    }

    @PostMapping("/upload")
    @RequirePermission(PermissionCodes.ATTACHMENT_UPLOAD)
    public AttachmentService.AttachmentUploadResult upload(
            @RequestParam Long businessDomainId,
            @RequestParam(defaultValue = "customer") String portalType,
            @RequestParam(required = false) String targetType,
            @RequestParam(required = false) Long targetId,
            @RequestParam(required = false) String relationType,
            @RequestParam("file") MultipartFile file) throws Exception {
        AttachmentService.UploadAttachmentCommand command = new AttachmentService.UploadAttachmentCommand(
                businessDomainId,
                portalType,
                file.getOriginalFilename(),
                file.getContentType(),
                file.getBytes(),
                targetType,
                targetId,
                relationType);
        return attachmentService.uploadAttachment(UserContextHolder.requireCurrent(), command);
    }

    @GetMapping("/{attachment_id}/download")
    @RequirePermission(PermissionCodes.ATTACHMENT_DOWNLOAD)
    public ResponseEntity<byte[]> download(@PathVariable("attachment_id") long attachmentId) {
        AttachmentService.AttachmentFileView file = attachmentService.findAttachment(attachmentId);
        byte[] content = attachmentService.loadAttachmentContent(attachmentId);
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION,
                        ContentDisposition.attachment()
                                .filename(file.fileName(), StandardCharsets.UTF_8)
                                .build()
                                .toString())
                .contentType(MediaType.parseMediaType(file.mimeType() == null ? MediaType.APPLICATION_OCTET_STREAM_VALUE : file.mimeType()))
                .body(content);
    }
}
