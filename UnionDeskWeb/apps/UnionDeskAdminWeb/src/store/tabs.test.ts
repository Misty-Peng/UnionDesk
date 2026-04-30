import { describe, expect, it, beforeEach } from "vitest";

import { appScopes } from "#src/router/extra-info/app-scope";

import { useTabsStore } from "./tabs";

describe("tabs store", () => {
	beforeEach(() => {
		useTabsStore.getState().resetTabs();
	});

	it("keeps business and platform tabs isolated", () => {
		const { addTab } = useTabsStore.getState();

		addTab(appScopes.business, "/system/menu", {
			key: "/system/menu",
			label: "system menu",
			closable: true,
			draggable: true,
		});
		addTab(appScopes.platform, "/platform/home", {
			key: "/platform/home",
			label: "platform home",
			closable: true,
			draggable: true,
		});

		const currentState = useTabsStore.getState();
		expect(currentState.business.openTabs.has("/system/menu")).toBe(true);
		expect(currentState.platform.openTabs.has("/platform/home")).toBe(true);
		expect(currentState.business.openTabs.has("/platform/home")).toBe(false);
		expect(currentState.platform.openTabs.has("/system/menu")).toBe(false);
	});

	it("resets both scopes together", () => {
		const { addTab, resetTabs } = useTabsStore.getState();

		addTab(appScopes.business, "/system/menu", {
			key: "/system/menu",
			label: "system menu",
			closable: true,
			draggable: true,
		});
		addTab(appScopes.platform, "/platform/home", {
			key: "/platform/home",
			label: "platform home",
			closable: true,
			draggable: true,
		});

		resetTabs();

		const currentState = useTabsStore.getState();
		expect(currentState.business.openTabs.size).toBe(0);
		expect(currentState.platform.openTabs.size).toBe(0);
	});
});
