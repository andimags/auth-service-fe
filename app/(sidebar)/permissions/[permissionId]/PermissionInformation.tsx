"use client"

import { Can } from "@/components/shared/Can"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { NAVIGATE_AWAY_DELAY_MS, REFRESH_DELAY_MS } from "@/constants/ui"
import { PermissionDto } from "@/dtos"
import { useDeletePermission } from "@/hooks/use-delete-permission"
import usePermissionFormDialog from "@/hooks/use-permission-form-dialog"
import formatDate from "@/lib/format-date"
import { Delete02Icon, PencilEdit01Icon } from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"
import { useRouter } from "next/navigation"

interface PermissionInformationProps {
    permission: PermissionDto
}

export default function PermissionInformation({
    permission,
}: Readonly<PermissionInformationProps>) {
    const permissionFormDialog = usePermissionFormDialog()
    const router = useRouter()
    const { deletePermission } = useDeletePermission({
        onSuccess: () => {
            setTimeout(() => router.push("/permissions"), NAVIGATE_AWAY_DELAY_MS)
        },
    })

    const handleEditPermission = () => {
        permissionFormDialog.open.edit(permission, () => {
            permissionFormDialog.close()
            setTimeout(() => router.refresh(), REFRESH_DELAY_MS)
        })
    }

    return (
        <div className="mx-auto w-full max-w-6xl text-neutral-900 transition-colors duration-200 dark:text-neutral-100">
            <div className="flex items-start justify-between pb-6">
                <div>
                    <h2 className="text-xl font-semibold tracking-tight text-neutral-900 dark:text-white">
                        Permission Information
                    </h2>
                    <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
                        Permission details and properties.
                    </p>
                </div>
                <div className="flex gap-2">
                    <Can requiredPermission={["auth:update:permission", "auth:admin:permission"]}>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={handleEditPermission}
                        >
                            <HugeiconsIcon
                                icon={PencilEdit01Icon}
                                strokeWidth={2}
                            />
                            <span>Edit Permission</span>
                        </Button>
                    </Can>
                    <Can requiredPermission={["auth:delete:permission", "auth:admin:permission"]}>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => deletePermission(permission)}
                        >
                            <HugeiconsIcon icon={Delete02Icon} strokeWidth={2} />
                            <span>Delete</span>
                        </Button>
                    </Can>
                </div>
            </div>

            <dl className="text-sm">
                <InfoRow label="Name">{permission.name}</InfoRow>
                <InfoRow label="Reference Name">{permission.ref_name}</InfoRow>
                <InfoRow label="Module">{permission.module}</InfoRow>
                <InfoRow label="Access Level">
                    <Badge variant="outline" className="capitalize">
                        {permission.access_level}
                    </Badge>
                </InfoRow>
                <InfoRow label="Description">
                    {permission.description ?? "-"}
                </InfoRow>
                <InfoRow label="System Permission">
                    <Badge
                        variant={permission.is_system ? "default" : "secondary"}
                    >
                        {permission.is_system ? "Yes" : "No"}
                    </Badge>
                </InfoRow>
                <InfoRow label="Created">
                    {formatDate(permission.created_at)}
                </InfoRow>
                <InfoRow label="Last Updated">
                    {formatDate(permission.updated_at)}
                </InfoRow>
            </dl>
        </div>
    )
}

function InfoRow({
    label,
    children,
}: Readonly<{
    label: string
    children: React.ReactNode
}>) {
    return (
        <div className="grid grid-cols-3 border-t border-neutral-200 py-5 dark:border-neutral-800">
            <dt className="font-semibold text-neutral-900 dark:text-neutral-200">
                {label}
            </dt>
            <dd className="col-span-2 text-neutral-600 dark:text-neutral-400">
                {children}
            </dd>
        </div>
    )
}
