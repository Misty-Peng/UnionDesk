import type { LoginUserView, PermissionSnapshot, PermissionSnapshotMenu } from "@uniondesk/shared";

import type { AppRouteRecordRaw } from "#src/router/types";

import type { UserInfoType } from "./types";

const BACKEND_MENU_PATH_MAP = new Map<string, string>([
	["/system/menus", "/system/menu"],
	["/system/roles", "/system/role"],
	["/system/users", "/system/user"],
	["/system/users/offboard-pool", "/system/user/offboard-pool"],
]);

interface BackendRouteNode {
	menu: PermissionSnapshotMenu
	path: string
	children: BackendRouteNode[]
}

type BackendAppRouteRecordRaw = AppRouteRecordRaw & {
	component?: string
};

export function normalizeAccessRoles(roles: readonly string[] = []) {
	const normalizedRoles: string[] = [];
	const seen = new Set<string>();

	for (const role of roles) {
		const lowerCaseRole = role.toLowerCase();
		const normalizedRole = lowerCaseRole === "super_admin" || lowerCaseRole === "domain_admin"
			? "admin"
			: lowerCaseRole === "agent"
				? "common"
				: lowerCaseRole;
		if (!seen.has(normalizedRole)) {
			seen.add(normalizedRole);
			normalizedRoles.push(normalizedRole);
		}
	}

	return normalizedRoles;
}

export function buildUserInfoFromLoginUser(user: LoginUserView, roles: readonly string[]): UserInfoType {
	return {
		id: user.id,
		avatar: "",
		username: user.username,
		email: user.email ?? "",
		phoneNumber: user.mobile ?? "",
		description: "",
		roles: normalizeAccessRoles(roles),
		platformAccess: false,
		menus: [],
	};
}

export function buildUserInfoFromPermissionSnapshot(snapshot: PermissionSnapshot): UserInfoType {
	return {
		id: snapshot.user.id,
		avatar: "",
		username: snapshot.user.username,
		email: snapshot.user.email ?? "",
		phoneNumber: snapshot.user.mobile ?? "",
		description: "",
		roles: normalizeAccessRoles(snapshot.roles),
		platformAccess: hasPlatformAccess(snapshot),
		menus: buildBackendRoutesFromSnapshot(snapshot.menus),
	};
}

export function hasPlatformAccess(snapshot: PermissionSnapshot): boolean {
	return snapshot.actions.some(action => action.code.startsWith("platform."));
}

export function buildBackendRoutesFromSnapshot(menus: readonly PermissionSnapshotMenu[]): BackendAppRouteRecordRaw[] {
	if (!menus.length) {
		return [];
	}

	const nodes = menus.map((menu) => ({
		menu,
		path: normalizeBackendMenuPath(menu.path),
		children: [] as BackendRouteNode[],
	}));

	const nodesById = new Map<number, BackendRouteNode>();
	for (const node of nodes) {
		if (typeof node.menu.id === "number") {
			nodesById.set(node.menu.id, node);
		}
	}

	const roots: BackendRouteNode[] = [];
	for (const node of nodes) {
		const parentId = node.menu.parentId;
		if (typeof parentId === "number" && nodesById.has(parentId)) {
			nodesById.get(parentId)!.children.push(node);
		}
		else {
			roots.push(node);
		}
	}

	sortBackendRouteNodes(roots);
	return roots.map(node => toAppRouteRecordRaw(node));
}

function normalizeBackendMenuPath(path: string) {
	const normalizedPath = path.trim().replace(/\/+$/, "");
	return BACKEND_MENU_PATH_MAP.get(normalizedPath) ?? normalizedPath;
}

function sortBackendRouteNodes(nodes: BackendRouteNode[]) {
	nodes.sort((left, right) => {
		const leftOrder = left.menu.orderNo ?? 0;
		const rightOrder = right.menu.orderNo ?? 0;
		if (leftOrder !== rightOrder) {
			return leftOrder - rightOrder;
		}
		return left.path.localeCompare(right.path);
	});
	for (const node of nodes) {
		if (node.children.length) {
			sortBackendRouteNodes(node.children);
		}
	}
}

function toAppRouteRecordRaw(node: BackendRouteNode): BackendAppRouteRecordRaw {
	const route: BackendAppRouteRecordRaw = {
		path: node.path,
		handle: {
			title: node.menu.name,
			icon: node.menu.icon ?? undefined,
			order: node.menu.orderNo ?? 0,
			hideInMenu: node.menu.hidden ?? false,
		},
	};

	if (node.children.length) {
		route.children = node.children.map(child => toAppRouteRecordRaw(child));
	}
	else {
		route.component = `${node.path}/index.tsx`;
	}

	return route;
}
