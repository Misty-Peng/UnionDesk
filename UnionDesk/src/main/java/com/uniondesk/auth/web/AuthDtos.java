package com.uniondesk.auth.web;

import com.fasterxml.jackson.annotation.JsonAlias;
import com.uniondesk.common.demo.DemoDtos.BusinessDomainView;
import com.uniondesk.common.demo.DemoDtos.LoginUserView;
import jakarta.validation.constraints.NotBlank;
import java.time.LocalDateTime;
import java.util.List;

public final class AuthDtos {

    private AuthDtos() {
    }

    public record LoginRequest(
            @JsonAlias({"identifier", "loginName"})
            @NotBlank String username,
            @NotBlank String password,
            String captchaToken) {
        public LoginRequest(String username, String password) {
            this(username, password, null);
        }
    }

    public record CaptchaChallengeResponse(
            String challengeId,
            long expiresInSeconds) {
    }

    public record CaptchaVerifyRequest(
            @NotBlank String challengeId,
            List<com.uniondesk.auth.core.AuthCaptchaService.TrackPoint> track) {
    }

    public record CaptchaVerifyResponse(
            String captchaToken,
            long expiresInSeconds) {
    }

    public record LoginResponse(
            String accessToken,
            String refreshToken,
            String sid,
            String role,
            String clientCode,
            String tokenType,
            long expiresInSeconds,
            LoginUserView user,
            List<BusinessDomainView> accessibleDomains,
            long defaultBusinessDomainId) {
    }

    public record LoginConfigView(
            boolean passwordLoginEnabled,
            boolean usernameLoginEnabled,
            boolean emailLoginEnabled,
            boolean mobileLoginEnabled,
            boolean captchaEnabled,
            boolean wechatLoginEnabled,
            String captchaHint,
            String wechatHint,
            int sessionTtlSeconds,
            int maxActiveSessionsPerUser,
            LocalDateTime updatedAt) {
    }

    public record UpdateLoginConfigRequest(
            Boolean passwordLoginEnabled,
            Boolean usernameLoginEnabled,
            Boolean emailLoginEnabled,
            Boolean mobileLoginEnabled,
            Boolean captchaEnabled,
            Boolean wechatLoginEnabled,
            String captchaHint,
            String wechatHint,
            Integer sessionTtlSeconds,
            Integer maxActiveSessionsPerUser) {
    }

    public record SessionView(
            long userId,
            String role,
            Long businessDomainId,
            String sid,
            String clientCode) {
    }

    public record OnlineSessionView(
            String sid,
            long userId,
            String clientCode,
            String username,
            String mobile,
            String email,
            String role,
            Long businessDomainId,
            String loginIdentifierMasked,
            String sessionStatus,
            LocalDateTime issuedAt,
            LocalDateTime expiresAt,
            LocalDateTime lastSeenAt,
            String clientIp,
            String userAgent) {
    }

    public record LoginLogView(
            long id,
            String sid,
            Long userId,
            String username,
            String loginIdentifierMasked,
            String loginIdentifierType,
            String eventType,
            String result,
            String reason,
            String clientIp,
            String userAgent,
            LocalDateTime createdAt) {
    }
}
