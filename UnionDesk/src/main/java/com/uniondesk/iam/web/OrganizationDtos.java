package com.uniondesk.iam.web;

public final class OrganizationDtos {

    private OrganizationDtos() {
    }

    public record OrganizationUnitView(
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
