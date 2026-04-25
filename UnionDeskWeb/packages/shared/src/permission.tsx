import React from "react";
import type { PermissionSnapshot } from "./types";
import { loadPermissionSnapshot } from "./storage";

export function hasAction(actionCode: string, snapshot?: PermissionSnapshot | null): boolean {
  if (!actionCode) {
    return false;
  }
  const current = snapshot ?? loadPermissionSnapshot();
  if (!current) {
    return false;
  }
  return current.actions.some((action) => action.code === actionCode);
}

export function hasAnyAction(actionCodes: string[], snapshot?: PermissionSnapshot | null): boolean {
  if (!Array.isArray(actionCodes) || actionCodes.length === 0) {
    return false;
  }
  const current = snapshot ?? loadPermissionSnapshot();
  if (!current) {
    return false;
  }
  const actionSet = new Set(current.actions.map((item) => item.code));
  return actionCodes.some((code) => actionSet.has(code));
}

export function useActionPermission(snapshot?: PermissionSnapshot | null) {
  const current = snapshot ?? loadPermissionSnapshot();
  return {
    hasAction: (actionCode: string) => hasAction(actionCode, current),
    hasAnyAction: (actionCodes: string[]) => hasAnyAction(actionCodes, current)
  };
}

type PermissionActionProps = {
  code: string;
  snapshot?: PermissionSnapshot | null;
  children: React.ReactNode;
};

export function PermissionAction({ code, snapshot, children }: PermissionActionProps) {
  if (!hasAction(code, snapshot)) {
    return null;
  }
  return <>{children}</>;
}
