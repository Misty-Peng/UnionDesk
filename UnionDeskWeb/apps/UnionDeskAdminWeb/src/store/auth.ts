import type { AuthType, LoginInfo } from "#src/api/user/types";

import { fetchLogin, fetchLogout } from "#src/api/auth";
import { buildUserInfoFromLoginUser } from "#src/api/user/utils";
import { useAccessStore } from "#src/store/access";
import { useTabsStore } from "#src/store/tabs";
import { useUserStore } from "#src/store/user";
import { getAppNamespace } from "#src/utils/get-app-namespace";

import { create } from "zustand";
import { persist } from "zustand/middleware";

const initialState: AuthType = {
	token: "",
	refreshToken: "",
	sid: "",
	role: "",
	clientCode: "ud-admin-web",
	tokenType: "",
	expiresInSeconds: 0,
	defaultBusinessDomainId: 0,
	user: null,
};

interface AuthAction {
	login: (loginPayload: LoginInfo) => Promise<void>
	logout: () => Promise<void>
	reset: () => void
};

export const useAuthStore = create<AuthType & AuthAction>()(
	persist<AuthType & AuthAction>((set, get) => ({
		...initialState,

		login: async (loginPayload) => {
			const response = await fetchLogin(loginPayload);
			const userInfo = buildUserInfoFromLoginUser(response.user, response.user.roles);
			const nextState: AuthType = {
				token: response.accessToken,
				refreshToken: response.refreshToken,
				sid: response.sid,
				role: response.role,
				clientCode: response.clientCode,
				tokenType: response.tokenType,
				expiresInSeconds: response.expiresInSeconds,
				defaultBusinessDomainId: response.defaultBusinessDomainId,
				user: userInfo,
			};
			set({
				...nextState,
			});
			useUserStore.getState().setUserInfo(userInfo);
		},

		logout: async () => {
			try {
				await fetchLogout();
			}
			finally {
				get().reset();
			}
		},

		reset: () => {
			set({
				...initialState,
			});
			useUserStore.getState().reset();
			useAccessStore.getState().reset();
			useTabsStore.getState().resetTabs();
		},

	}), { name: getAppNamespace("access-token") }),
);
