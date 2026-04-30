import { describe, expect, it } from "vitest";

import { shouldNavigateToActiveTab } from "./tab-navigation";

describe("shouldNavigateToActiveTab", () => {
	it("does not navigate back when a menu click changes the current route before activeKey catches up", () => {
		expect(shouldNavigateToActiveTab({
			activeFullPath: "/platform/home",
			currentFullPath: "/platform/menu",
			previousActiveKey: "/platform/home",
			activeKey: "/platform/home",
		})).toBe(false);
	});

	it("navigates when tab actions change the active key while the route still points to the closed tab", () => {
		expect(shouldNavigateToActiveTab({
			activeFullPath: "/platform/home",
			currentFullPath: "/platform/menu",
			previousActiveKey: "/platform/menu",
			activeKey: "/platform/home",
		})).toBe(true);
	});
});
