import { ProtectedRoute } from "@/components/shared/ProtectedRoute"
import { authOptions } from "@/lib/next-auth"
import { checkPermission } from "@/lib/rbac"
import { fetchWithAccessResult } from "@/lib/fetch-with-access-result"
import { getPolicies } from "@/services/policy.service"
import { getRolePolicies } from "@/services/role-policy.service"
import { getRole } from "@/services/role.service"
import { getServerSession } from "next-auth/next"
import { redirect } from "next/navigation"
import RoleInformation from "./RoleInformation"

export const dynamic = "force-dynamic"

export default async function Page({
    params,
}: Readonly<{
    params: Promise<{ roleId: string }>
}>) {
    const { roleId } = await params
    const session = await getServerSession(authOptions)
    const canManagePolicies = checkPermission(session, ["auth:admin:role_policy", "auth:update:role_policy"])

    const [roleResult, rolePoliciesResult, policiesResult] = await Promise.all([
        fetchWithAccessResult(
            (auth) => getRole({ roleId, ...auth }),
            null
        ),
        fetchWithAccessResult(
            (auth) => getRolePolicies({ roleId: Number.parseInt(roleId, 10), ...auth }),
            []
        ),
        fetchWithAccessResult(
            (auth) => getPolicies(auth),
            []
        ),
    ])

    if (!roleResult.allowed || !roleResult.data) {
        redirect("/403")
    }

    return (
        <ProtectedRoute>
            <RoleInformation
                role={roleResult.data}
                rolePolicies={rolePoliciesResult.data}
                policies={policiesResult.data}
                canViewPolicies={policiesResult.allowed}
                canViewRolePolicies={rolePoliciesResult.allowed}
                canManagePolicies={canManagePolicies}
            />
        </ProtectedRoute>
    )
}
