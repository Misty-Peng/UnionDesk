import type { IamUser } from "@uniondesk/shared";

import { requestBackendJson } from "#src/api/backend";

export function fetchPlatformUsers(): Promise<IamUser[]> {
	return requestBackendJson<IamUser[]>("v1/iam/users");
}

export function fetchPlatformOffboardPoolUsers(): Promise<IamUser[]> {
	return requestBackendJson<IamUser[]>("v1/iam/users/offboard-pool");
}
