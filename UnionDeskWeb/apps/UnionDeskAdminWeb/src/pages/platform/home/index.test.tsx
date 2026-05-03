import type { PlatformOverview } from "#src/api/platform/overview";

import { render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
	fetchPlatformOverview: vi.fn(),
}));

vi.mock("#src/api/platform/overview", () => ({
	fetchPlatformOverview: mocks.fetchPlatformOverview,
}));

import PlatformHome from "./index";

const overview: PlatformOverview = {
	domainCount: 3,
	activeUserCount: 5,
	disabledUserCount: 2,
	offboardUserCount: 1,
	pendingImportTaskCount: 0,
	announcementCount: 0,
	recentAuditCount: 2,
	loginLogs: [
		{
			id: 101,
			sid: "sid-101",
			userId: 1,
			username: "super-admin",
			loginIdentifierMasked: "adm***",
			loginIdentifierType: "username",
			eventType: "login",
			result: "success",
			reason: null,
			clientIp: "127.0.0.1",
			userAgent: "Chrome",
			createdAt: "2026-04-30T10:00:00Z",
		},
		{
			id: 102,
			sid: "sid-102",
			userId: null,
			username: "guest",
			loginIdentifierMasked: "gue***",
			loginIdentifierType: "username",
			eventType: "login",
			result: "failure",
			reason: "bad_credentials",
			clientIp: "127.0.0.2",
			userAgent: "Firefox",
			createdAt: "2026-04-30T11:00:00Z",
		},
	],
};

describe("PlatformHome", () => {
	beforeEach(() => {
		mocks.fetchPlatformOverview.mockReset();
	});

	it("loads real overview stats and renders audit items", async () => {
		mocks.fetchPlatformOverview.mockResolvedValue(overview);

		render(<PlatformHome />);

		await waitFor(() => expect(mocks.fetchPlatformOverview).toHaveBeenCalledTimes(1));
		expect(await screen.findByText("3")).toBeInTheDocument();
		expect(screen.getByText("5")).toBeInTheDocument();
		expect(screen.getByText("1")).toBeInTheDocument();
		expect(screen.getByText("super-admin")).toBeInTheDocument();
		expect(screen.getByText("登录成功")).toBeInTheDocument();
		expect(screen.getByText("guest")).toBeInTheDocument();
		expect(screen.getByText("登录失败")).toBeInTheDocument();
	});

	it("shows a fallback error when overview loading fails", async () => {
		mocks.fetchPlatformOverview.mockRejectedValue(new Error("network"));

		render(<PlatformHome />);

		expect(await screen.findByText("平台首页统计加载失败，请稍后重试。")).toBeInTheDocument();
	});
});
