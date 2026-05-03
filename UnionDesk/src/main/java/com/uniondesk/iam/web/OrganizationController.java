package com.uniondesk.iam.web;

import com.uniondesk.auth.core.UserContext;
import com.uniondesk.auth.core.UserContextHolder;
import com.uniondesk.iam.core.OrganizationService;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

@RestController
@RequestMapping("/api/v1/iam/organizations")
public class OrganizationController {

    private final OrganizationService organizationService;

    public OrganizationController(OrganizationService organizationService) {
        this.organizationService = organizationService;
    }

    @GetMapping
    public List<OrganizationDtos.OrganizationUnitView> listOrganizations() {
        requireSuperAdminContext();
        return organizationService.listOrganizations().stream()
                .map(unit -> new OrganizationDtos.OrganizationUnitView(
                        unit.id(),
                        unit.code(),
                        unit.name(),
                        unit.parentId(),
                        unit.parentName(),
                        unit.leaderUserId(),
                        unit.leaderName(),
                        unit.orderNo(),
                        unit.status(),
                        unit.remark()))
                .toList();
    }

    private UserContext requireSuperAdminContext() {
        UserContext context = UserContextHolder.current()
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "unauthorized"));
        if (!"super_admin".equalsIgnoreCase(context.role())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "forbidden");
        }
        return context;
    }
}
