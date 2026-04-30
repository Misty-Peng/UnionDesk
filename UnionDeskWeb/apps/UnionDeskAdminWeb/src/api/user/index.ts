import type { AppRouteRecordRaw } from "#src/router/types";

import { fetchPermissionSnapshot } from "#src/api/auth";
import { requestBackendJson } from "#src/api/backend";

import { buildBackendRoutesFromSnapshot, buildUserInfoFromPermissionSnapshot } from "./utils";
import type { UserInfoType } from "./types";

export * from "./types";
export { createCaptchaChallenge, fetchLogin, fetchLoginConfig, fetchLogout, fetchPermissionSnapshot, fetchSessionStatus, verifyCaptcha } from "#src/api/auth";

export async function fetchUserInfo(): Promise<UserInfoType> {
	const snapshot = await fetchPermissionSnapshot();
	return buildUserInfoFromPermissionSnapshot(snapshot);
}

export async function fetchAsyncRoutes(): Promise<AppRouteRecordRaw[]> {
	const snapshot = await fetchPermissionSnapshot();
	return buildBackendRoutesFromSnapshot(snapshot.menus);
}

export interface RefreshTokenResult {
	token: string
	refreshToken: string
}

export async function fetchRefreshToken(data: { readonly refreshToken: string }) {
	return requestBackendJson<RefreshTokenResult>("v1/auth/refresh-token", {
		method: "POST",
		json: data,
	});
}
