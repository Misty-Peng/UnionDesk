package com.uniondesk.iam.web;

import com.uniondesk.auth.core.UserContext;
import com.uniondesk.auth.core.UserContextHolder;
import com.uniondesk.iam.core.IamService;
import com.uniondesk.iam.core.IamService.CreateMenuCommand;
import com.uniondesk.iam.core.IamService.CreateResourceCommand;
import com.uniondesk.iam.core.IamService.CreateRoleCommand;
import com.uniondesk.iam.core.IamService.CreateUserCommand;
import com.uniondesk.iam.core.IamService.IamResource;
import com.uniondesk.iam.core.IamService.MenuTreeNode;
import com.uniondesk.iam.core.IamService.PermissionSnapshot;
import com.uniondesk.iam.core.IamService.RolePermissions;
import com.uniondesk.iam.core.IamService.RoleView;
import com.uniondesk.iam.core.IamService.UpdateMenuCommand;
import com.uniondesk.iam.core.IamService.UpdateResourceCommand;
import com.uniondesk.iam.core.IamService.UpdateRoleCommand;
import com.uniondesk.iam.core.IamService.UpdateUserCommand;
import com.uniondesk.iam.core.IamService.UserAccount;
import jakarta.validation.Valid;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

@RestController
@RequestMapping("/api/v1/iam")
public class IamController {

    private final IamService iamService;

    public IamController(IamService iamService) {
        this.iamService = iamService;
    }

    @GetMapping("/resources")
    public List<IamDtos.ResourceView> listResources(
            @RequestParam(required = false) String resourceType,
            @RequestParam(required = false) String clientScope) {
        requireSuperAdminContext();
        return iamService.listResources(resourceType, clientScope).stream()
                .map(this::toResourceView)
                .toList();
    }

    @PostMapping("/resources")
    @ResponseStatus(HttpStatus.CREATED)
    public IamDtos.ResourceView createResource(@Valid @RequestBody IamDtos.CreateResourceRequest request) {
        requireSuperAdminContext();
        IamResource resource = iamService.createResource(new CreateResourceCommand(
                request.resourceType(),
                request.resourceCode(),
                request.resourceName(),
                request.clientScope(),
                request.httpMethod(),
                request.pathPattern(),
                request.parentId(),
                request.orderNo(),
                request.icon(),
                request.component(),
                request.hidden(),
                request.status()));
        return toResourceView(resource);
    }

    @PutMapping("/resources/{id}")
    public IamDtos.ResourceView updateResource(@PathVariable long id, @Valid @RequestBody IamDtos.UpdateResourceRequest request) {
        requireSuperAdminContext();
        IamResource resource = iamService.updateResource(id, new UpdateResourceCommand(
                request.resourceType(),
                request.resourceCode(),
                request.resourceName(),
                request.clientScope(),
                request.httpMethod(),
                request.pathPattern(),
                request.parentId(),
                request.orderNo(),
                request.icon(),
                request.component(),
                request.hidden(),
                request.status()));
        return toResourceView(resource);
    }

    @GetMapping("/roles/{roleId}/resources")
    public List<IamDtos.ResourceView> listRoleResources(@PathVariable int roleId) {
        requireSuperAdminContext();
        return iamService.listRoleResources(roleId).stream()
                .map(this::toResourceView)
                .toList();
    }

    @PutMapping("/roles/{roleId}/resources")
    public List<IamDtos.ResourceView> replaceRoleResources(
            @PathVariable int roleId,
            @Valid @RequestBody IamDtos.ReplaceRoleResourcesRequest request) {
        requireSuperAdminContext();
        return iamService.replaceRoleResources(roleId, request.resourceIds()).stream()
                .map(this::toResourceView)
                .toList();
    }

    @GetMapping("/menus/tree")
    public List<IamDtos.MenuTreeNodeView> listMenusTree(@RequestParam(required = false) String clientScope) {
        requireSuperAdminContext();
        return iamService.listMenuTree(clientScope).stream().map(this::toMenuTreeNodeView).toList();
    }

    @PostMapping("/menus")
    @ResponseStatus(HttpStatus.CREATED)
    public IamDtos.ResourceView createMenu(@Valid @RequestBody IamDtos.CreateMenuRequest request) {
        requireSuperAdminContext();
        IamResource resource = iamService.createMenu(new CreateMenuCommand(
                request.resourceCode(),
                request.resourceName(),
                request.path(),
                request.clientScope(),
                request.parentId(),
                request.orderNo(),
                request.icon(),
                request.component(),
                request.hidden(),
                request.status()));
        return toResourceView(resource);
    }

    @PutMapping("/menus/{menuId}")
    public IamDtos.ResourceView updateMenu(@PathVariable long menuId, @Valid @RequestBody IamDtos.UpdateMenuRequest request) {
        requireSuperAdminContext();
        IamResource resource = iamService.updateMenu(menuId, new UpdateMenuCommand(
                request.resourceCode(),
                request.resourceName(),
                request.path(),
                request.clientScope(),
                request.parentId(),
                request.orderNo(),
                request.icon(),
                request.component(),
                request.hidden(),
                request.status()));
        return toResourceView(resource);
    }

    @DeleteMapping("/menus/{menuId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteMenu(@PathVariable long menuId) {
        requireSuperAdminContext();
        iamService.deleteMenu(menuId);
    }

    @GetMapping("/roles")
    public List<IamDtos.RoleView> listRoles() {
        requireSuperAdminContext();
        return iamService.listRoles().stream().map(this::toRoleView).toList();
    }

    @PostMapping("/roles")
    @ResponseStatus(HttpStatus.CREATED)
    public IamDtos.RoleView createRole(@Valid @RequestBody IamDtos.CreateRoleRequest request) {
        requireSuperAdminContext();
        RoleView role = iamService.createRole(new CreateRoleCommand(request.code(), request.name(), request.scope()));
        return toRoleView(role);
    }

    @PutMapping("/roles/{roleId}")
    public IamDtos.RoleView updateRole(@PathVariable int roleId, @Valid @RequestBody IamDtos.UpdateRoleRequest request) {
        requireSuperAdminContext();
        RoleView role = iamService.updateRole(roleId, new UpdateRoleCommand(request.code(), request.name(), request.scope()));
        return toRoleView(role);
    }

    @DeleteMapping("/roles/{roleId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteRole(@PathVariable int roleId) {
        requireSuperAdminContext();
        iamService.deleteRole(roleId);
    }

    @GetMapping("/roles/{roleId}/permissions")
    public IamDtos.RolePermissionsView getRolePermissions(@PathVariable int roleId) {
        requireSuperAdminContext();
        RolePermissions permissions = iamService.loadRolePermissions(roleId);
        return new IamDtos.RolePermissionsView(
                permissions.roleId(),
                permissions.menuResourceIds(),
                permissions.actionResourceIds());
    }

    @PutMapping("/roles/{roleId}/permissions")
    public IamDtos.RolePermissionsView replaceRolePermissions(
            @PathVariable int roleId,
            @Valid @RequestBody IamDtos.ReplaceRolePermissionsRequest request) {
        requireSuperAdminContext();
        RolePermissions permissions = iamService.replaceRolePermissions(
                roleId,
                request.menuResourceIds(),
                request.actionResourceIds());
        return new IamDtos.RolePermissionsView(
                permissions.roleId(),
                permissions.menuResourceIds(),
                permissions.actionResourceIds());
    }

    @GetMapping("/users")
    public List<IamDtos.UserAccountView> listUsers() {
        requireSuperAdminContext();
        return iamService.listUsers(false).stream().map(this::toUserAccountView).toList();
    }

    @PostMapping("/users")
    @ResponseStatus(HttpStatus.CREATED)
    public IamDtos.UserAccountView createUser(@Valid @RequestBody IamDtos.CreateUserRequest request) {
        requireSuperAdminContext();
        UserAccount user = iamService.createUser(new CreateUserCommand(
                request.username(),
                request.mobile(),
                request.email(),
                request.password(),
                request.accountType(),
                request.roleCodes(),
                request.businessDomainIds()));
        return toUserAccountView(user);
    }

    @PutMapping("/users/{userId}")
    public IamDtos.UserAccountView updateUser(@PathVariable long userId, @Valid @RequestBody IamDtos.UpdateUserRequest request) {
        requireSuperAdminContext();
        UserAccount user = iamService.updateUser(userId, new UpdateUserCommand(
                request.username(),
                request.mobile(),
                request.email(),
                request.password(),
                request.accountType(),
                request.roleCodes(),
                request.businessDomainIds(),
                request.status()));
        return toUserAccountView(user);
    }

    @PostMapping("/users/{userId}/offboard")
    public IamDtos.UserAccountView offboardUser(@PathVariable long userId, @RequestBody(required = false) IamDtos.OffboardUserRequest request) {
        UserContext context = requireSuperAdminContext();
        UserAccount user = iamService.offboardUser(
                userId,
                context.userId(),
                request == null ? null : request.reason());
        return toUserAccountView(user);
    }

    @PostMapping("/users/{userId}/restore")
    public IamDtos.UserAccountView restoreUser(@PathVariable long userId) {
        requireSuperAdminContext();
        return toUserAccountView(iamService.restoreUser(userId));
    }

    @GetMapping("/users/offboard-pool")
    public List<IamDtos.UserAccountView> listOffboardPool() {
        requireSuperAdminContext();
        return iamService.listUsers(true).stream().map(this::toUserAccountView).toList();
    }

    @DeleteMapping("/users/{userId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteUserPermanently(@PathVariable long userId) {
        requireSuperAdminContext();
        iamService.deleteUserPermanently(userId);
    }

    @GetMapping("/me/menu-resources")
    public List<IamDtos.ResourceView> currentMenuResources() {
        return iamService.listCurrentMenuResources(requireCurrentContext()).stream()
                .map(this::toResourceView)
                .toList();
    }

    @GetMapping("/me/permission-snapshot")
    public IamDtos.PermissionSnapshotView currentPermissionSnapshot() {
        PermissionSnapshot snapshot = iamService.loadPermissionSnapshot(requireCurrentContext());
        return new IamDtos.PermissionSnapshotView(
                new IamDtos.UserView(
                        snapshot.user().id(),
                        snapshot.user().username(),
                        snapshot.user().mobile(),
                        snapshot.user().email()),
                snapshot.clientCode(),
                snapshot.roles(),
                snapshot.domains().stream()
                        .map(domain -> new IamDtos.DomainView(domain.id(), domain.code(), domain.name()))
                        .toList(),
                snapshot.menus().stream()
                        .map(menu -> new IamDtos.MenuView(
                                menu.id(),
                                menu.resourceCode(),
                                menu.resourceName(),
                                menu.pathPattern(),
                                menu.parentId(),
                                menu.orderNo(),
                                menu.icon(),
                                menu.component(),
                                menu.hidden()))
                        .toList(),
                snapshot.actions().stream()
                        .map(action -> new IamDtos.ActionView(action.resourceCode(), action.httpMethod(), action.pathPattern()))
                        .toList(),
                snapshot.issuedAt());
    }

    private UserContext requireCurrentContext() {
        return UserContextHolder.current()
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "unauthorized"));
    }

    private UserContext requireSuperAdminContext() {
        UserContext context = requireCurrentContext();
        if (!"super_admin".equalsIgnoreCase(context.role())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "forbidden");
        }
        return context;
    }

    private IamDtos.ResourceView toResourceView(IamResource resource) {
        return new IamDtos.ResourceView(
                resource.id(),
                resource.resourceType(),
                resource.resourceCode(),
                resource.resourceName(),
                resource.clientScope(),
                resource.httpMethod(),
                resource.pathPattern(),
                resource.parentId(),
                resource.orderNo(),
                resource.icon(),
                resource.component(),
                resource.hidden(),
                resource.status());
    }

    private IamDtos.MenuTreeNodeView toMenuTreeNodeView(MenuTreeNode node) {
        return new IamDtos.MenuTreeNodeView(
                node.id(),
                node.code(),
                node.name(),
                node.path(),
                node.clientScope(),
                node.parentId(),
                node.orderNo(),
                node.icon(),
                node.component(),
                node.hidden(),
                node.status(),
                node.children().stream().map(this::toMenuTreeNodeView).toList());
    }

    private IamDtos.RoleView toRoleView(RoleView role) {
        return new IamDtos.RoleView(role.id(), role.code(), role.name(), role.scope(), role.system());
    }

    private IamDtos.UserAccountView toUserAccountView(UserAccount user) {
        return new IamDtos.UserAccountView(
                user.id(),
                user.username(),
                user.mobile(),
                user.email(),
                user.accountType(),
                user.status(),
                user.employmentStatus(),
                user.roleCodes(),
                user.businessDomainIds(),
                user.offboardedAt(),
                user.offboardedBy(),
                user.offboardReason());
    }
}
