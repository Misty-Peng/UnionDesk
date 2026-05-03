package com.uniondesk.iam.admin;

import com.uniondesk.iam.core.PermissionCodes;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Objects;
import java.util.Optional;
import org.springframework.util.AntPathMatcher;

public final class AdminPermissionCatalog {

    private static final AntPathMatcher PATH_MATCHER = new AntPathMatcher();

    private static final List<PermissionDefinition> DEFINITIONS = List.of(
            new PermissionDefinition(PermissionCodes.PLATFORM_MENU_READ, "查看菜单", "platform", "GET", "/api/v1/iam/menus/tree"),
            new PermissionDefinition(PermissionCodes.PLATFORM_MENU_CREATE, "创建菜单", "platform", "POST", "/api/v1/iam/menus"),
            new PermissionDefinition(PermissionCodes.PLATFORM_MENU_UPDATE, "更新菜单", "platform", "PUT", "/api/v1/iam/menus/*"),
            new PermissionDefinition(PermissionCodes.PLATFORM_MENU_DELETE, "删除菜单", "platform", "DELETE", "/api/v1/iam/menus/*"),
            new PermissionDefinition(PermissionCodes.PLATFORM_ROLE_READ, "查看角色", "platform", "GET", "/api/v1/iam/roles"),
            new PermissionDefinition(PermissionCodes.PLATFORM_ROLE_CREATE, "创建角色", "platform", "POST", "/api/v1/iam/roles"),
            new PermissionDefinition(PermissionCodes.PLATFORM_ROLE_UPDATE, "更新角色", "platform", "PUT", "/api/v1/iam/roles/*"),
            new PermissionDefinition(PermissionCodes.PLATFORM_ROLE_DELETE, "删除角色", "platform", "DELETE", "/api/v1/iam/roles/*"),
            new PermissionDefinition(PermissionCodes.PLATFORM_ROLE_PERMISSION_READ, "查看角色授权", "platform", "GET", "/api/v1/iam/roles/*/permissions"),
            new PermissionDefinition(PermissionCodes.PLATFORM_ROLE_PERMISSION_UPDATE, "更新角色授权", "platform", "PUT", "/api/v1/iam/roles/*/permissions"),
            new PermissionDefinition(PermissionCodes.PLATFORM_USER_READ, "查看平台用户", "platform", "GET", "/api/v1/iam/users"),
            new PermissionDefinition(PermissionCodes.DOMAIN_USER_CREATE, "创建域用户", "domain", "POST", "/api/v1/iam/users"),
            new PermissionDefinition(PermissionCodes.PLATFORM_USER_CREATE, "创建平台用户", "platform", "POST", "/api/v1/iam/users"),
            new PermissionDefinition(PermissionCodes.PLATFORM_USER_UPDATE, "更新平台用户", "platform", "PUT", "/api/v1/iam/users/*"),
            new PermissionDefinition(PermissionCodes.PLATFORM_USER_DISABLE, "停用平台用户", "platform", "POST", "/api/v1/iam/users/*/offboard"),
            new PermissionDefinition(PermissionCodes.PLATFORM_USER_RESTORE, "恢复平台用户", "platform", "POST", "/api/v1/iam/users/*/restore"),
            new PermissionDefinition(PermissionCodes.PLATFORM_USER_OFFBOARD_POOL_READ, "查看离职池", "platform", "GET", "/api/v1/iam/users/offboard-pool"),
            new PermissionDefinition(PermissionCodes.PLATFORM_USER_DELETE, "删除平台用户", "platform", "DELETE", "/api/v1/iam/users/*"));

    private static final Map<String, PermissionDefinition> BY_CODE = buildByCode();

    private AdminPermissionCatalog() {
    }

    public static List<PermissionDefinition> list() {
        return DEFINITIONS;
    }

    public static Optional<PermissionDefinition> findByCode(String code) {
        if (code == null) {
            return Optional.empty();
        }
        return Optional.ofNullable(BY_CODE.get(code.trim()));
    }

    public static Optional<PermissionDefinition> findByRequest(String method, String requestPath) {
        if (method == null || requestPath == null) {
            return Optional.empty();
        }
        String normalizedMethod = method.trim().toUpperCase(Locale.ROOT);
        return DEFINITIONS.stream()
                .filter(definition -> definition.httpMethod().equals(normalizedMethod))
                .filter(definition -> PATH_MATCHER.match(definition.pathPattern(), requestPath))
                .findFirst();
    }

    private static Map<String, PermissionDefinition> buildByCode() {
        Map<String, PermissionDefinition> definitions = new LinkedHashMap<>();
        for (PermissionDefinition definition : DEFINITIONS) {
            PermissionDefinition previous = definitions.put(definition.code(), definition);
            if (previous != null) {
                throw new IllegalStateException("duplicate permission code: " + definition.code());
            }
        }
        return definitions;
    }

    public record PermissionDefinition(
            String code,
            String name,
            String permissionScope,
            String httpMethod,
            String pathPattern) {

        public PermissionDefinition {
            Objects.requireNonNull(code, "code");
            Objects.requireNonNull(name, "name");
            Objects.requireNonNull(permissionScope, "permissionScope");
            Objects.requireNonNull(httpMethod, "httpMethod");
            Objects.requireNonNull(pathPattern, "pathPattern");
        }
    }
}
