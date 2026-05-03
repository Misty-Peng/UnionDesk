package com.uniondesk.iam.admin;

import static org.assertj.core.api.Assertions.assertThat;

import com.uniondesk.iam.core.PermissionCodes;
import org.junit.jupiter.api.Test;

class AdminPermissionCatalogTests {

    @Test
    void userCreateRouteUsesDomainUserCreatePermissionWithChineseName() {
        assertThat(AdminPermissionCatalog.findByRequest("POST", "/api/v1/iam/users"))
                .hasValueSatisfying(permission -> {
                    assertThat(permission.code()).isEqualTo(PermissionCodes.DOMAIN_USER_CREATE);
                    assertThat(permission.name()).isEqualTo("创建域用户");
                    assertThat(permission.permissionScope()).isEqualTo("domain");
                });
    }

    @Test
    void platformUserCreatePermissionIsStillListedAsPlatformPermission() {
        assertThat(AdminPermissionCatalog.findByCode(PermissionCodes.PLATFORM_USER_CREATE))
                .hasValueSatisfying(permission -> {
                    assertThat(permission.name()).isEqualTo("创建平台用户");
                    assertThat(permission.permissionScope()).isEqualTo("platform");
                });
    }
}
