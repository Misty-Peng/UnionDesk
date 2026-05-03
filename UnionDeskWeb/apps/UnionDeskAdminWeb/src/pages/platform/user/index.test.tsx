import type { IamUser } from "@uniondesk/shared";

import { render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
	fetchUsers: vi.fn(),
	fetchPlatformUsers: vi.fn(),
}));

vi.mock("@uniondesk/shared", () => ({
	fetchUsers: mocks.fetchUsers,
}));

vi.mock("#src/api/platform/iam", () => ({
	fetchPlatformUsers: mocks.fetchPlatformUsers,
}));

import PlatformUser from "./index";

const iamUsers: IamUser[] = [
	{
		id: 11,
		username: "real-admin",
		mobile: "13800000001",
		email: "admin@example.com",
		accountType: "admin",
		status: 1,
		employmentStatus: "active",
		roleCodes: ["platform_admin"],
		businessDomainIds: [7],
	},
	{
		id: 12,
		username: "real-disabled",
		mobile: "13800000002",
		email: null,
		accountType: "admin",
		status: 0,
		employmentStatus: "active",
		roleCodes: ["security_auditor"],
		businessDomainIds: [],
	},
	{
		id: 13,
		username: "real-offboard",
		mobile: "13800000003",
		email: "offboard@example.com",
		accountType: "admin",
		status: 1,
		employmentStatus: "offboarded",
		roleCodes: ["platform_operator"],
		businessDomainIds: [8, 9],
	},
];

describe("PlatformUser", () => {
	beforeEach(() => {
		mocks.fetchUsers.mockReset();
		mocks.fetchPlatformUsers.mockReset();
	});

	it("loads platform users from IAM and renders returned rows", async () => {
		mocks.fetchUsers.mockResolvedValue([]);
		mocks.fetchPlatformUsers.mockResolvedValue(iamUsers);

		render(<PlatformUser />);

		await waitFor(() => expect(mocks.fetchPlatformUsers).toHaveBeenCalledTimes(1));
		expect(mocks.fetchUsers).not.toHaveBeenCalled();
		expect(await screen.findByText("real-admin")).toBeInTheDocument();
		expect(screen.getByText("域 #7")).toBeInTheDocument();
		expect(screen.getByText("real-disabled")).toBeInTheDocument();
		expect(screen.getByText("停用")).toBeInTheDocument();
		expect(screen.getByText("real-offboard")).toBeInTheDocument();
		expect(screen.getAllByText("离职").length).toBeGreaterThan(0);
	});
});
