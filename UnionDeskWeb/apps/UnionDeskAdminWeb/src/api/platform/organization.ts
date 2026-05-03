import type { PlatformOrganizationView } from "@uniondesk/shared";

import { requestBackendJson } from "#src/api/backend";

export function fetchPlatformOrganizations(): Promise<PlatformOrganizationView[]> {
	return requestBackendJson<PlatformOrganizationView[]>("v1/iam/organizations");
}
