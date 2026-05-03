import { render, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => {
	const getUserInfo = vi.fn().mockRejectedValue({
		response: {
			status: 401,
		},
	});

	return {
		goLogin: vi.fn(),
		navigate: vi.fn(),
		navigateElement: vi.fn(),
		getUserInfo,
		setAccessStore: vi.fn(),
		hideLoading: vi.fn(),
		setupLoading: vi.fn(),
		authState: {
			token: "stale-token",
		},
		userState: {
			id: 0,
			roles: [],
			getUserInfo,
		},
		accessState: {
			setAccessStore: vi.fn(),
			isAccessChecked: false,
			routeList: [],
		},
		preferencesState: {
			enableBackendAccess: false,
			enableFrontendAceess: false,
		},
		locationState: {
			pathname: "/",
			search: "",
		},
	};
});

vi.mock("#src/utils/request/go-login", () => ({
	goLogin: mocks.goLogin,
}));

vi.mock("#src/plugins/hide-loading", () => ({
	hideLoading: mocks.hideLoading,
}));

vi.mock("#src/plugins/loading", () => ({
	setupLoading: mocks.setupLoading,
}));

vi.mock("#src/hooks/use-current-route", () => ({
	useCurrentRoute: () => undefined,
}));

vi.mock("#src/router/extra-info", () => ({
	loginPath: "/login",
	exception403Path: "/exception/403",
	exception404Path: "/exception/404",
	exception500Path: "/exception/500",
}));

vi.mock("#src/router/routes", () => ({
	accessRoutes: [],
	whiteRouteNames: ["/login"],
}));

vi.mock("#src/router/routes/config", () => ({
	isSendRoutingRequest: false,
}));

vi.mock("#src/router/utils/generate-routes-from-backend", () => ({
	generateRoutesFromBackend: vi.fn(),
}));

vi.mock("#src/router/utils/generate-routes-from-frontend", () => ({
	generateRoutesByFrontend: vi.fn(),
}));

vi.mock("#src/store/access", () => ({
	useAccessStore: (selector?: (state: typeof mocks.accessState) => unknown) => {
		if (selector) {
			return selector(mocks.accessState);
		}
		return mocks.accessState;
	},
}));

vi.mock("#src/store/auth", () => ({
	useAuthStore: (selector: (state: typeof mocks.authState) => unknown) => selector(mocks.authState),
}));

vi.mock("#src/store/preferences", () => ({
	usePreferencesStore: (selector: (state: typeof mocks.preferencesState) => unknown) => selector(mocks.preferencesState),
}));

vi.mock("#src/store/user", () => ({
	useUserStore: (selector: (state: typeof mocks.userState) => unknown) => selector(mocks.userState),
}));

vi.mock("react-router", () => ({
	Navigate: (props: { to: string }) => {
		mocks.navigateElement(props);
		return null;
	},
	matchRoutes: () => [],
	useLocation: () => mocks.locationState,
	useNavigate: () => mocks.navigate,
	useSearchParams: () => [new URLSearchParams(), vi.fn()],
}));

import { AuthGuard } from "./auth-guard";

describe("AuthGuard", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		mocks.getUserInfo.mockRejectedValue({
			response: {
				status: 401,
			},
		});
		mocks.authState.token = "stale-token";
		mocks.userState.id = 0;
		mocks.userState.roles = [];
		mocks.accessState.isAccessChecked = false;
		mocks.locationState.pathname = "/";
		mocks.locationState.search = "";
	});

	it("redirects to login when the current token is unauthorized", async () => {
		render(
			<AuthGuard>
				<div>content</div>
			</AuthGuard>,
		);

		await waitFor(() => {
			expect(mocks.goLogin).toHaveBeenCalledTimes(1);
		});

		expect(mocks.navigate).not.toHaveBeenCalled();
	});

	it.each([
		"/system/menu",
		"/platform/menu",
	])("waits for access restoration on %s refresh instead of replacing the current route with login", (pathname) => {
		mocks.getUserInfo.mockReturnValue(new Promise(() => undefined));
		mocks.locationState.pathname = pathname;

		render(
			<AuthGuard>
				<div>content</div>
			</AuthGuard>,
		);

		expect(mocks.navigateElement).not.toHaveBeenCalledWith(expect.objectContaining({
			to: "/login",
		}));
	});
});
