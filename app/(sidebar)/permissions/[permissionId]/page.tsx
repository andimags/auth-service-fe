import { authOptions } from "@/lib/next-auth"
import { fetchWithAccessResult } from "@/lib/fetch-with-access-result"
import { getPermission } from "@/services/permission.service"
import { getServerSession } from "next-auth/next"
import PermissionInformation from "./PermissionInformation"
import { redirect } from "next/navigation"
import { ProtectedRoute } from "@/components/shared/ProtectedRoute"

export const dynamic = "force-dynamic"

export default async function Page({
    params,
}: Readonly<{
    params: Promise<{ permissionId: string }>
}>) {
    const { permissionId } = await params
    const session = await getServerSession(authOptions)

    if (!session) {
        redirect("/login")
    }

    const permissionResult = await fetchWithAccessResult(
        (auth) => getPermission({ permissionId, ...auth }),
        null
    )

    if (!permissionResult.allowed || !permissionResult.data) {
        redirect("/403")
    }

    return (
        <ProtectedRoute>
            <PermissionInformation permission={permissionResult.data} />
        </ProtectedRoute>
    )
}
