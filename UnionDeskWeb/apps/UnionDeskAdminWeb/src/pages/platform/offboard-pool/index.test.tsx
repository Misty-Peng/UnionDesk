import type { IamUser } from "@uniondesk/shared";

import { render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
	fetchOffboardPoolUsers: vi.fn(),
	fetchPlatformOffboardPoolUsers: vi.fn(),
}));

vi.mock("@uniondesk/shared", () => ({
	fetchOffboardPoolUsers: mocks.fetchOffboardPoolUsers,
}));

vi.mock("#src/api/platform/iam", () => ({
	fetchPlatformOffboardPoolUsers: mocks.fetchPlatformOffboardPoolUsers,
}));

import PlatformOffboardPool from "./index";

const offboardUsers: IamUser[] = [
	{
		id: 21,
		username: "former-admin",
		mobile: "13800000021",
		email: "former@example.com",
		accountType: "admin",
		status: 1,
		employmentStatus: "offboarded",
		roleCodes: ["platform_admin"],
		businessDomainIds: [3],
		offboardedAt: "2026-04-28 10:00:00",
		offboardedBy: 1,
		offboardReason: "人员离职",
	},
];

describe("PlatformOffboardPool", () => {
	beforeEach(() => {
		mocks.fetchOffboardPoolUsers.mockReset();
		mocks.fetchPlatformOffboardPoolUsers.mockReset();
	});

	it("loads offboard users from IAM and renders returned rows", async () => {
		mocks.fetchOffboardPoolUsers.mockResolvedValue([]);
		mocks.fetchPlatformOffboardPoolUsers.mockResolvedValue(offboardUsers);

		render(<PlatformOffboardPool />);

		await waitFor(() => expect(mocks.fetchPlatformOffboardPoolUsers).toHaveBeenCalledTimes(1));
		expect(mocks.fetchOffboardPoolUsers).not.toHaveBeenCalled();
		expect(await screen.findByText("former-admin")).toBeInTheDocument();
		expect(screen.getByText("域 #3")).toBeInTheDocument();
		expect(screen.getByText("人员离职")).toBeInTheDocument();
	});
});
