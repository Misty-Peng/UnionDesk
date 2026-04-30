import { beforeEach, describe, expect, it } from "vitest";

import { rememberRoute } from "./index";

describe("rememberRoute", () => {
	beforeEach(() => {
		window.location.hash = "";
		window.history.replaceState({}, "", "/");
	});

	it("keeps the current hash route as redirect target", () => {
		window.location.hash = "#/system/menu?tab=1";

		expect(rememberRoute()).toBe("?redirect=/system/menu?tab=1");
	});

	it("does not remember the login route itself", () => {
		window.location.hash = "#/login";

		expect(rememberRoute()).toBe("");
	});
});
