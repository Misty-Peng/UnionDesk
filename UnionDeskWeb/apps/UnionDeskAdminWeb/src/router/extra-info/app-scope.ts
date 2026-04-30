import { platformHomePath, platformPath } from "./route-path";

export const appScopes = {
	business: "business",
	platform: "platform",
} as const;

export type AppScope = typeof appScopes[keyof typeof appScopes];

const businessHomePath = import.meta.env.VITE_BASE_HOME_PATH || "/system/menu";

export function isPlatformRoutePath(pathname?: string) {
	return typeof pathname === "string" && (pathname === platformPath || pathname.startsWith(`${platformPath}/`));
}

export function getAppScopeByPath(pathname?: string): AppScope {
	return isPlatformRoutePath(pathname) ? appScopes.platform : appScopes.business;
}

export function getAppHomePath(scope: AppScope) {
	return scope === appScopes.platform ? platformHomePath : businessHomePath;
}
