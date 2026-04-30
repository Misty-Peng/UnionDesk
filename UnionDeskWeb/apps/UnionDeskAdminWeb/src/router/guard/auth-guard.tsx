import type { AppRouteRecordRaw } from "#src/router/types";
import type { UserInfoType } from "#src/api/user/types";

import { fetchAsyncRoutes } from "#src/api/user";
import { useCurrentRoute } from "#src/hooks/use-current-route";
import { hideLoading } from "#src/plugins/hide-loading";
import { setupLoading } from "#src/plugins/loading";
import { exception403Path, exception404Path, exception500Path, loginPath } from "#src/router/extra-info";
import { accessRoutes, whiteRouteNames } from "#src/router/routes";
import { isSendRoutingRequest } from "#src/router/routes/config";
import { goLogin } from "#src/utils/request/go-login";
import { generateRoutesFromBackend } from "#src/router/utils/generate-routes-from-backend";
import { generateRoutesByFrontend } from "#src/router/utils/generate-routes-from-frontend";
import { useAccessStore } from "#src/store/access";
import { useAuthStore } from "#src/store/auth";
import { usePreferencesStore } from "#src/store/preferences";
import { useUserStore } from "#src/store/user";

import { useEffect } from "react";
import { matchRoutes, Navigate, useLocation, useNavigate } from "react-router";

import { removeDuplicateRoutes } from "./utils";

const noLoginWhiteList = Array.from(whiteRouteNames).filter(item => item !== loginPath);

interface AuthGuardProps {
	children?: React.ReactNode
}

type UnauthorizedReason = {
	response?: {
		status?: number
	}
};

function isUnauthorizedReason(reason: unknown) {
	if (typeof reason !== "object" || reason === null) {
		return false;
	}

	const response = "response" in reason ? (reason as UnauthorizedReason).response : undefined;
	return response?.status === 401;
}

export function AuthGuard({ children }: AuthGuardProps) {
	const navigate = useNavigate();
	const currentRoute = useCurrentRoute();
	const { pathname, search } = useLocation();
	const isLogin = useAuthStore(state => Boolean(state.token));
	const isAuthorized = useUserStore(state => Boolean(state.id));
	const getUserInfo = useUserStore(state => state.getUserInfo);
	const userRoles = useUserStore(state => state.roles);
	const { setAccessStore, isAccessChecked, routeList } = useAccessStore();
	const { enableBackendAccess, enableFrontendAceess } = usePreferencesStore(state => state);

	const isPathInNoLoginWhiteList = noLoginWhiteList.includes(pathname);

	useEffect(() => {
		async function fetchUserInfoAndRoutes() {
			setupLoading();

			const [userInfoResult, routeResult] = await Promise.allSettled([
				isAuthorized ? Promise.resolve<UserInfoType | null>(null) : getUserInfo(),
				isAuthorized && enableBackendAccess && isSendRoutingRequest
					? fetchAsyncRoutes()
					: Promise.resolve<AppRouteRecordRaw[] | null>(null),
			] as const);

			const routes: AppRouteRecordRaw[] = [];
			const latestRoles: string[] = isAuthorized ? [...userRoles] : [];

			if (!isAuthorized && userInfoResult.status === "fulfilled" && userInfoResult.value) {
				latestRoles.push(...userInfoResult.value.roles ?? []);
				if (enableBackendAccess && userInfoResult.value.menus?.length) {
					routes.push(...await generateRoutesFromBackend(userInfoResult.value.menus));
				}
			}

			if (enableBackendAccess && isAuthorized && isSendRoutingRequest && routeResult.status === "fulfilled" && routeResult.value) {
				routes.push(...await generateRoutesFromBackend(routeResult.value));
			}

			if (enableFrontendAceess) {
				routes.push(...generateRoutesByFrontend(accessRoutes, latestRoles));
			}

			const uniqueRoutes = removeDuplicateRoutes(routes);
			setAccessStore(uniqueRoutes);

			const hasError = userInfoResult.status === "rejected" || routeResult.status === "rejected";
			if (hasError) {
				const unAuthorized = [userInfoResult, routeResult].some(result => result.status === "rejected" && isUnauthorizedReason(result.reason));
				if (unAuthorized) {
					goLogin();
					return;
				}
				return navigate(exception500Path);
			}

			navigate(`${pathname}${search}`, {
				replace: true,
				flushSync: true,
			});
		}

		if (!whiteRouteNames.includes(pathname) && isLogin && !isAccessChecked) {
			void fetchUserInfoAndRoutes();
		}
	}, [
		pathname,
		search,
		isLogin,
		isAuthorized,
		isAccessChecked,
		enableBackendAccess,
		enableFrontendAceess,
		getUserInfo,
		userRoles,
		navigate,
		setAccessStore,
	]);

	if (isPathInNoLoginWhiteList) {
		hideLoading();
		return children;
	}

	if (!isLogin) {
		hideLoading();
		if (pathname !== loginPath) {
			const redirectPath = pathname.length > 1 ? `${loginPath}?redirect=${pathname}${search}` : loginPath;
			return <Navigate to={redirectPath} replace />;
		}
		return children;
	}

	if (pathname === loginPath) {
		hideLoading();
		return children;
	}

	if (!isAuthorized) {
		hideLoading();
		return <Navigate to={loginPath} replace />;
	}

	if (!isAccessChecked) {
		return null;
	}

	hideLoading();

	if (pathname === "/") {
		return <Navigate to={import.meta.env.VITE_BASE_HOME_PATH} replace />;
	}

	const routeRoles = currentRoute?.handle?.roles;
	const ignoreAccess = currentRoute?.handle?.ignoreAccess;

	if (ignoreAccess === true) {
		return children;
	}

	const matches = matchRoutes(routeList, pathname) ?? [];
	const hasChildren = matches[matches.length - 1]?.route?.children?.filter(item => !item.index)?.length;
	if (hasChildren && hasChildren > 0) {
		return <Navigate to={exception404Path} replace />;
	}

	const hasRoutePermission = userRoles.some(role => routeRoles?.includes(role));
	if (routeRoles && routeRoles.length && !hasRoutePermission) {
		return <Navigate to={exception403Path} replace />;
	}

	return children;
}
