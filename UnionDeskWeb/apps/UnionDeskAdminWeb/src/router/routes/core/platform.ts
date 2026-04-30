import type { AppRouteRecordRaw } from "#src/router/types";

import { platformHomePath, platformPath } from "#src/router/extra-info";

import { ApartmentOutlined, AppstoreOutlined, DashboardOutlined, MenuOutlined, TeamOutlined, UserDeleteOutlined, UserOutlined } from "@ant-design/icons";
import { createElement, lazy } from "react";

import ContainerLayout from "#src/layout/container-layout";

const PlatformHome = lazy(() => import("#src/pages/platform/home"));
const PlatformUser = lazy(() => import("#src/pages/platform/user"));
const PlatformDept = lazy(() => import("#src/pages/platform/dept"));
const PlatformOffboardPool = lazy(() => import("#src/pages/platform/offboard-pool"));
const PlatformRole = lazy(() => import("#src/pages/system/role"));
const PlatformMenu = lazy(() => import("#src/pages/system/menu"));

const routes: AppRouteRecordRaw[] = [
	{
		path: platformPath,
		Component: ContainerLayout,
		handle: {
			hideInMenu: true,
			title: "平台管理",
			icon: createElement(AppstoreOutlined),
			roles: ["admin"],
		},
		children: [
			{
				path: platformHomePath,
				Component: PlatformHome,
				handle: {
					title: "平台首页",
					icon: createElement(DashboardOutlined),
					roles: ["admin"],
				},
			},
			{
				path: `${platformPath}/user`,
				Component: PlatformUser,
				handle: {
					title: "平台用户",
					icon: createElement(UserOutlined),
					roles: ["admin"],
					permissions: [
						"permission:button:add",
						"permission:button:update",
						"permission:button:delete",
					],
				},
			},
			{
				path: `${platformPath}/dept`,
				Component: PlatformDept,
				handle: {
					keepAlive: false,
					title: "平台组织",
					icon: createElement(ApartmentOutlined),
					roles: ["admin"],
					permissions: [
						"permission:button:add",
						"permission:button:update",
						"permission:button:delete",
					],
				},
			},
			{
				path: `${platformPath}/offboard-pool`,
				Component: PlatformOffboardPool,
				handle: {
					title: "离职池",
					icon: createElement(UserDeleteOutlined),
					roles: ["admin"],
					permissions: [
						"permission:button:update",
						"permission:button:delete",
					],
				},
			},
			{
				path: `${platformPath}/role`,
				Component: PlatformRole,
				handle: {
					title: "平台角色",
					icon: createElement(TeamOutlined),
					roles: ["admin"],
					permissions: [
						"permission:button:add",
						"permission:button:update",
						"permission:button:delete",
					],
				},
			},
			{
				path: `${platformPath}/menu`,
				Component: PlatformMenu,
				handle: {
					title: "平台菜单",
					icon: createElement(MenuOutlined),
					roles: ["admin"],
					permissions: [
						"permission:button:add",
						"permission:button:update",
						"permission:button:delete",
					],
				},
			},
		],
	},
];

export default routes;
