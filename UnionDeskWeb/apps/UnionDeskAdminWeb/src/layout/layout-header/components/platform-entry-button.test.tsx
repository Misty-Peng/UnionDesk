import { render, screen, fireEvent } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => {
	return {
		navigate: vi.fn(),
		assign: vi.fn(),
		hasAccessByRoles: vi.fn(),
		pathname: "/system/menu",
	};
});

vi.mock("#src/hooks/use-access", () => ({
	AccessControlRoles: {
		admin: "admin",
	},
	useAccess: () => ({
		hasAccessByRoles: mocks.hasAccessByRoles,
	}),
}));

vi.mock("react-router", () => ({
	useLocation: () => ({
		pathname: mocks.pathname,
		search: "",
	}),
	useNavigate: () => mocks.navigate,
}));

import { PlatformEntryButton } from "./platform-entry-button";

describe("PlatformEntryButton", () => {
	beforeEach(() => {
		mocks.navigate.mockReset();
		mocks.assign.mockReset();
		mocks.hasAccessByRoles.mockReset();
		Object.defineProperty(window.location, "assign", {
			configurable: true,
			value: mocks.assign,
		});
	});

	it("renders platform entry for platform admins and navigates to the platform home", () => {
		mocks.hasAccessByRoles.mockReturnValue(true);
		mocks.pathname = "/system/menu";

		render(<PlatformEntryButton />);

		const button = screen.getByRole("link", { name: "平台管理" });
		expect(button).toBeInTheDocument();

		fireEvent.click(button);
		expect(mocks.navigate).toHaveBeenCalledWith("/platform/home");
		expect(mocks.assign).not.toHaveBeenCalled();
	});

	it("shows return label on the platform page", () => {
		mocks.hasAccessByRoles.mockReturnValue(true);
		mocks.pathname = "/platform/home";

		render(<PlatformEntryButton />);

		const button = screen.getByRole("link", { name: "返回业务端" });
		expect(button).toBeInTheDocument();

		fireEvent.click(button);
		expect(mocks.assign).toHaveBeenCalledWith("/system/menu");
		expect(mocks.navigate).not.toHaveBeenCalled();
	});

	it("does not render without platform access", () => {
		mocks.hasAccessByRoles.mockReturnValue(false);
		mocks.pathname = "/system/menu";

		render(<PlatformEntryButton />);

		expect(screen.queryByRole("button", { name: "平台管理" })).not.toBeInTheDocument();
	});
});
