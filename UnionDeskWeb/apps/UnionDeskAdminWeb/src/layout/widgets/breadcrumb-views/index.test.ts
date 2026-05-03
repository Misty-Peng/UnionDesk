import { describe, expect, it } from "vitest";

import { buildBreadcrumbItems } from "./index";

describe("buildBreadcrumbItems", () => {
	it("omits route records marked as hidden in breadcrumb", () => {
		const items = buildBreadcrumbItems([
			{
				pathname: "/platform",
				handle: {
					title: "平台管理",
					hideInBreadcrumb: true,
				},
			},
			{
				pathname: "/platform/menu",
				handle: {
					title: "平台菜单",
				},
			},
		], title => title);

		expect(items.map(item => item.title)).toEqual(["平台菜单"]);
	});
});
