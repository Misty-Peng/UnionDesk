import { describe, expect, it } from "vitest";

import { buildPasswordLoginPayload, normalizeAccessRoles } from "./utils";

describe("login utils", () => {
	it("maps backend roles to frontend access roles", () => {
		expect(normalizeAccessRoles(["super_admin", "domain_admin", "agent"])).toEqual(["admin", "common"]);
		expect(normalizeAccessRoles(["super_admin"])).toEqual(["admin"]);
		expect(normalizeAccessRoles(["agent"])).toEqual(["common"]);
	});

	it("keeps captcha token on password login payload", () => {
		expect(buildPasswordLoginPayload(
			{
				username: "admin",
				password: "admin123",
			},
			"captcha-token-123",
		)).toEqual({
			username: "admin",
			password: "admin123",
			captchaToken: "captcha-token-123",
		});
	});
});
