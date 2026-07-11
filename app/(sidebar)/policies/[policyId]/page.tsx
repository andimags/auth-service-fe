import { ProtectedRoute } from "@/components/shared/ProtectedRoute"
import { authOptions } from "@/lib/next-auth"
import { checkPermission } from "@/lib/rbac"
import { fetchWithAccessResult } from "@/lib/fetch-with-access-result"
import { getPermissions } from "@/services/permission.service"
import { getPolicyPermissions } from "@/services/policy-permission.service"
import { getPolicy } from "@/services/policy.service"
import { getServerSession } from "next-auth/next"
import { redirect } from "next/navigation"
import PolicyInformation from "./PolicyInformation"

export const dynamic = "force-dynamic"

export default async function Page({
    params,
}: Readonly<{
    params: Promise<{ policyId: string }>
}>) {
    const { policyId } = await params
    const session = await getServerSession(authOptions)

    if (!session) {
        redirect("/login")
    }

    const canManagePermissions = checkPermission(session, [
        "auth:admin:policy_permission",
        "auth:assign:policy_permission",
        "auth:update:policy_permission"
    ])

    const [policyResult, policyPermissionsResult, permissionsResult] = await Promise.all([
        fetchWithAccessResult(
            (auth) => getPolicy({ policyId, ...auth }),
            null
        ),
        fetchWithAccessResult(
            (auth) => getPolicyPermissions({ policyId: Number.parseInt(policyId, 10), ...auth }),
            []
        ),
        fetchWithAccessResult(
            (auth) => getPermissions(auth),
            []
        ),
    ])

    if (!policyResult.allowed || !policyResult.data) {
        redirect("/403")
    }

    return (
        <ProtectedRoute>
            <PolicyInformation
                policy={policyResult.data}
                policyPermissions={policyPermissionsResult.data}
                permissions={permissionsResult.data}
                canViewPermissions={permissionsResult.allowed}
                canViewPolicyPermissions={policyPermissionsResult.allowed}
                canManagePermissions={canManagePermissions}
            />
        </ProtectedRoute>
    )
}
