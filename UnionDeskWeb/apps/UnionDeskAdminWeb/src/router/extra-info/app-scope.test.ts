import { describe, expect, it } from "vitest";

import { appScopes, getAppHomePath, getAppScopeByPath } from "./app-scope";

describe("app-scope", () => {
	it("resolves platform routes to the platform scope", () => {
		expect(getAppScopeByPath("/platform/home")).toBe(appScopes.platform);
		expect(getAppScopeByPath("/platform/menu")).toBe(appScopes.platform);
	});

	it("resolves business routes to the business scope", () => {
		expect(getAppScopeByPath("/system/menu")).toBe(appScopes.business);
		expect(getAppScopeByPath("/login")).toBe(appScopes.business);
	});

	it("returns the matching home path for each scope", () => {
		const businessHomePath = import.meta.env.VITE_BASE_HOME_PATH || "/system/menu";
		expect(getAppHomePath(appScopes.platform)).toBe("/platform/home");
		expect(getAppHomePath(appScopes.business)).toBe(businessHomePath);
	});
});
