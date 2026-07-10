import UserInformation from "@/app/(sidebar)/users/[userId]/UserInformation"
import { authOptions } from "@/lib/next-auth"
import { checkPermission } from "@/lib/rbac"
import { fetchWithAccessResult } from "@/lib/fetch-with-access-result"
import { getRoles } from "@/services/role.service"
import { getUserRoles } from "@/services/user-role.service"
import { getUser } from "@/services/user.service"
import { getServerSession } from "next-auth/next"
import { redirect } from "next/navigation"

export const dynamic = "force-dynamic"

export default async function Page({
    params,
}: Readonly<{
    params: Promise<{ userId: string }>
}>) {
    const { userId } = await params
    const session = await getServerSession(authOptions)

    if (!session) {
        redirect("/login")
    }

    // This one isn't tied to a fetch — it's purely "should the button
    // render," so it's fine as a plain permission check.
    const canManageRoles = checkPermission(session, ["auth:admin:user-role", "auth:assign:user_role", "auth:update:user_role"])

    const [userResult, userRolesResult, rolesResult] = await Promise.all([
        fetchWithAccessResult(
            (auth) => getUser({ userId, ...auth }),
            null
        ),
        fetchWithAccessResult(
            (auth) => getUserRoles({ userId: Number.parseInt(userId), ...auth }),
            []
        ),
        fetchWithAccessResult(
            (auth) => getRoles(auth),
            []
        ),
    ])

    // The BE's response is the only authority here — no isSelf, no
    // permission formula on the FE. If it said no, we redirect.
    if (!userResult.allowed || !userResult.data) {
        redirect("/403")
    }

    return (
        <UserInformation
            user={userResult.data}
            userRoles={userRolesResult.data}
            roles={rolesResult.data}
            canViewRoles={rolesResult.allowed}
            canViewUserRoles={userRolesResult.allowed}
            canManageRoles={canManageRoles}
        />
    )
}