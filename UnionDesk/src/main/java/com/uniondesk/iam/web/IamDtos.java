package com.uniondesk.iam.web;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import java.util.List;

public final class IamDtos {

    private IamDtos() {
    }

    public record CreateResourceRequest(
            @NotBlank String resourceType,
            @NotBlank String resourceCode,
            @NotBlank String resourceName,
            @NotBlank String clientScope,
            String httpMethod,
            String pathPattern,
            Long parentId,
            Integer orderNo,
            String icon,
            String component,
            Boolean hidden,
            Integer status) {
    }

    public record UpdateResourceRequest(
            String resourceType,
            String resourceCode,
            String resourceName,
            String clientScope,
            String httpMethod,
            String pathPattern,
            Long parentId,
            Integer orderNo,
            String icon,
            String component,
            Boolean hidden,
            Integer status) {
    }

    public record ReplaceRoleResourcesRequest(
            @NotNull List<Long> resourceIds) {
    }

    public record ResourceView(
            long id,
            String resourceType,
            String resourceCode,
            String resourceName,
            String clientScope,
            String httpMethod,
            String pathPattern,
            Long parentId,
            Integer orderNo,
            String icon,
            String component,
            boolean hidden,
            int status) {
    }

    public record PermissionSnapshotView(
            UserView user,
            String clientCode,
            List<String> roles,
            List<DomainView> domains,
            List<MenuView> menus,
            List<ActionView> actions,
            String issuedAt) {
    }

    public record UserView(
            long id,
            String username,
            String mobile,
            String email) {
    }

    public record DomainView(
            long id,
            String code,
            String name) {
    }

    public record MenuView(
            long id,
            String code,
            String name,
            String path,
            Long parentId,
            Integer orderNo,
            String icon,
            String component,
            boolean hidden) {
    }

    public record ActionView(
            String code,
            String httpMethod,
            String pathPattern) {
    }

    public record MenuTreeNodeView(
            long id,
            String code,
            String name,
            String path,
            String clientScope,
            Long parentId,
            Integer orderNo,
            String icon,
            String component,
            boolean hidden,
            int status,
            List<MenuTreeNodeView> children) {
    }

    public record CreateMenuRequest(
            @NotBlank String resourceCode,
            @NotBlank String resourceName,
            @NotBlank String path,
            @NotBlank String clientScope,
            Long parentId,
            Integer orderNo,
            String icon,
            String component,
            Boolean hidden,
            Integer status) {
    }

    public record UpdateMenuRequest(
            String resourceCode,
            String resourceName,
            String path,
            String clientScope,
            Long parentId,
            Integer orderNo,
            String icon,
            String component,
            Boolean hidden,
            Integer status) {
    }

    public record RoleView(
            int id,
            String code,
            String name,
            String scope,
            boolean system) {
    }

    public record CreateRoleRequest(
            @NotBlank String code,
            @NotBlank String name,
            @NotBlank String scope) {
    }

    public record UpdateRoleRequest(
            String code,
            String name,
            String scope) {
    }

    public record RolePermissionsView(
            int roleId,
            List<Long> menuResourceIds,
            List<Long> actionResourceIds) {
    }

    public record ReplaceRolePermissionsRequest(
            @NotNull List<Long> menuResourceIds,
            @NotNull List<Long> actionResourceIds) {
    }

    public record UserAccountView(
            long id,
            String username,
            String mobile,
            String email,
            String accountType,
            int status,
            String employmentStatus,
            List<String> roleCodes,
            List<Long> businessDomainIds,
            String offboardedAt,
            Long offboardedBy,
            String offboardReason) {
    }

    public record CreateUserRequest(
            @NotBlank String username,
            @NotBlank String mobile,
            String email,
            @NotBlank String password,
            @NotBlank String accountType,
            @NotEmpty List<String> roleCodes,
            @NotNull List<Long> businessDomainIds) {
    }

    public record UpdateUserRequest(
            String username,
            String mobile,
            String email,
            String password,
            String accountType,
            List<String> roleCodes,
            List<Long> businessDomainIds,
            Integer status) {
    }

    public record OffboardUserRequest(
            String reason) {
    }
}
