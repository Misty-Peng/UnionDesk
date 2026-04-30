import type { AppRouteRecordRaw } from "#src/router/types";

import { describe, expect, it } from "vitest";

import { appScopes } from "#src/router/extra-info/app-scope";
import { generateMenuItemsFromRoutes } from "./generate-menu-items-from-routes";

function createRoute(route: Partial<AppRouteRecordRaw>) {
	return route as AppRouteRecordRaw;
}

describe("generateMenuItemsFromRoutes", () => {
	const routeList = [
		createRoute({
			path: "/system",
			handle: { title: "系统管理" },
			children: [
				createRoute({
					path: "/system/user",
					handle: { title: "用户管理" },
				}),
			],
		}),
		createRoute({
			path: "/platform",
			handle: {
				title: "平台管理",
				hideInMenu: true,
			},
			children: [
				createRoute({
					path: "/platform/home",
					handle: { title: "平台首页" },
				}),
				createRoute({
					path: "/platform/user",
					handle: { title: "平台用户" },
				}),
			],
		}),
	] satisfies AppRouteRecordRaw[];

	it("keeps business menus in the business scope", () => {
		const businessMenus = generateMenuItemsFromRoutes(routeList, appScopes.business);

		expect(businessMenus).toEqual([
			{
				key: "/system",
				label: "系统管理",
				children: [
					{
						key: "/system/user",
						label: "用户管理",
					},
				],
			},
		]);
	});

	it("bubbles visible platform children into the platform scope", () => {
		const platformMenus = generateMenuItemsFromRoutes(routeList, appScopes.platform);

		expect(platformMenus).toEqual([
			{
				key: "/platform/home",
				label: "平台首页",
			},
			{
				key: "/platform/user",
				label: "平台用户",
			},
		]);
	});
});
