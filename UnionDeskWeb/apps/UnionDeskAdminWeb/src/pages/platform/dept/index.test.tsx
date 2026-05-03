import { render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
	fetchPlatformOrganizations: vi.fn(),
}));

vi.mock("#src/api/platform/organization", () => ({
	fetchPlatformOrganizations: mocks.fetchPlatformOrganizations,
}));

import PlatformDept from "./index";

describe("PlatformDept", () => {
	beforeEach(() => {
		mocks.fetchPlatformOrganizations.mockReset();
	});

	it("loads organizations from platform api and renders tree and table", async () => {
		mocks.fetchPlatformOrganizations.mockResolvedValue([
			{
				id: 1,
				code: "platform-root",
				name: "平台组织",
				parentId: null,
				parentName: null,
				leaderUserId: 1,
				leaderName: "admin",
				orderNo: 10,
				status: 1,
				remark: "平台组织根节点",
			},
			{
				id: 2,
				code: "platform-ops",
				name: "平台运营部",
				parentId: 1,
				parentName: "平台组织",
				leaderUserId: 1,
				leaderName: "admin",
				orderNo: 20,
				status: 1,
				remark: "负责平台账号与角色治理",
			},
		]);

		render(<PlatformDept />);

		await waitFor(() => expect(mocks.fetchPlatformOrganizations).toHaveBeenCalledTimes(1));
		expect(await screen.findAllByText("平台组织")).not.toHaveLength(0);
		expect(screen.getAllByText("平台运营部")).not.toHaveLength(0);
		expect(screen.getAllByText("admin")).not.toHaveLength(0);
		expect(screen.getByText("负责平台账号与角色治理")).toBeInTheDocument();
	});
});
