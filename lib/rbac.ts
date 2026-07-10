import { UserLevelType } from "@/constants/enums";

type PermissionInput = string | string[];

export function hasPermission(
    requiredPermissions: PermissionInput,
    userPermissions: string[] = [],
    requireAll: boolean = false,
): boolean {
    const _requiredPermissions = Array.isArray(requiredPermissions)
        ? requiredPermissions
        : [requiredPermissions];

    if(requireAll){
        return _requiredPermissions.every((p) =>
            userPermissions.includes(p)
        );
    }
    else{
        return _requiredPermissions.some((p) =>
            userPermissions.includes(p)
        );
    }
}

export function isSuperadmin(level?: string): boolean {
    return (
        level === UserLevelType.root_superadmin ||
        level === UserLevelType.superadmin
    );
}

export function checkPermission(
    session: { user?: { level?: string }; permissions?: string[] } | null,
    requiredPermissions: PermissionInput,
    requireAll: boolean = false
): boolean {
    if (!session) return false;
    if (isSuperadmin(session.user?.level)) return true;
    return hasPermission(requiredPermissions, session.permissions, requireAll);
}