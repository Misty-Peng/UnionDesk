import type { PermissionSnapshot } from "@uniondesk/shared";

import { describe, expect, it } from "vitest";

import { buildUserInfoFromPermissionSnapshot } from "./utils";

describe("user utils", () => {
	it("marks platform access when the permission snapshot contains platform actions", () => {
		const snapshot: PermissionSnapshot = {
			user: {
				id: 1,
				username: "admin",
				mobile: null,
				email: null,
			},
			clientCode: "ud-admin-web",
			roles: ["domain_admin"],
			domains: [],
			menus: [],
			actions: [
				{
					code: "platform.user.read",
					name: "平台用户查看",
				},
			],
			issuedAt: "2026-04-30T22:00:00",
		};

		const userInfo = buildUserInfoFromPermissionSnapshot(snapshot);

		expect(userInfo.platformAccess).toBe(true);
	});
});
