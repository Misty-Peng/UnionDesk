import { loginPath } from "#src/router/extra-info";

export function rememberRoute() {
	const currentHashPath = window.location.hash.startsWith("#")
		? window.location.hash.slice(1)
		: "";
	const { pathname, search } = window.location;
	const currentPath = currentHashPath || `${pathname}${search}`;
	if (currentPath.length > 1 && currentPath !== loginPath) {
		return `?redirect=${currentPath}`;
	}
	return "";
}
