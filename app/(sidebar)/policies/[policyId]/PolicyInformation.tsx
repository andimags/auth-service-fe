"use client"

import { Can } from "@/components/shared/Can"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { NAVIGATE_AWAY_DELAY_MS, REFRESH_DELAY_MS } from "@/constants/ui"
import { PermissionDto, PolicyDto, PolicyPermissionDto } from "@/dtos"
import { useDeletePolicy } from "@/hooks/use-delete-policy"
import usePolicyFormDialog from "@/hooks/use-policy-form-dialog"
import formatDate from "@/lib/format-date"
import {
    Delete02Icon,
    PencilEdit01Icon,
    ShieldUserIcon,
} from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { ManagePermissionsDialog } from "./ManagePermissionsDialog"

interface PolicyInformationProps {
    policy: PolicyDto
    policyPermissions: PolicyPermissionDto[]
    permissions: PermissionDto[]
    canViewPermissions: boolean
    canViewPolicyPermissions: boolean
    canManagePermissions: boolean
}

export default function PolicyInformation({
    policy,
    policyPermissions,
    permissions,
    canViewPermissions,
    canViewPolicyPermissions,
    canManagePermissions,
}: Readonly<PolicyInformationProps>) {
    const [isOpen, setIsOpen] = useState(false)
    const policyFormDialog = usePolicyFormDialog()
    const router = useRouter()

    const { deletePolicy } = useDeletePolicy({
        onSuccess: () => {
            setTimeout(() => router.push("/policies"), NAVIGATE_AWAY_DELAY_MS)
        },
    })

    const handleEditPolicy = () => {
        policyFormDialog.open.edit(policy, () => {
            policyFormDialog.close()
            setTimeout(() => router.refresh(), REFRESH_DELAY_MS)
        })
    }

    const handleManagePermissions = () => {
        setIsOpen(true)
    }

    const selectedValues = policyPermissions.map((permission) =>
        permission.ref_name
    )

    const permissionOptions = permissions.map((permission) => ({
        label: `${permission.ref_name} | ${permission.name}`,
        value: permission.ref_name,
    }))

    const renderPermissionsContent = () => {
        if (!canViewPolicyPermissions || !canViewPermissions) {
            return (
                <span className="text-sm text-neutral-400 italic dark:text-neutral-500">
                    You do not have permission to view this policy's permissions.
                </span>
            )
        }

        if (policyPermissions.length === 0) {
            return (
                <span className="text-sm text-neutral-500 dark:text-neutral-400">
                    No permissions attached to this policy
                </span>
            )
        }

        return policyPermissions.map((permission) => (
            <Link href={`/permissions/${permission.id}`} key={permission.id}>
                <Badge variant="outline">{permission.ref_name}</Badge>
            </Link>
        ))
    }

    return (
        <>
            <ManagePermissionsDialog
                isOpen={isOpen}
                setIsOpen={setIsOpen}
                options={permissionOptions}
                selectedValues={selectedValues}
                policy={policy}
            />
            <div className="mx-auto w-full max-w-6xl text-neutral-900 transition-colors duration-200 dark:text-neutral-100">
                <div className="flex items-start justify-between pb-6">
                    <div>
                        <h2 className="text-xl font-semibold tracking-tight text-neutral-900 dark:text-white">
                            Policy Information
                        </h2>
                        <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
                            Policy details and attached permissions.
                        </p>
                    </div>
                    <div className="flex gap-2">
                        <Can requiredPermission={["auth:update:policy", "auth:admin:policy"]}>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={handleEditPolicy}
                            >
                                <HugeiconsIcon
                                    icon={PencilEdit01Icon}
                                    strokeWidth={2}
                                />
                                <span>Edit Policy</span>
                            </Button>
                        </Can>
                        {canManagePermissions && (
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={handleManagePermissions}
                            >
                                <HugeiconsIcon
                                    icon={ShieldUserIcon}
                                    strokeWidth={2}
                                />
                                <span>Manage Permissions</span>
                            </Button>
                        )}
                        <Can requiredPermission={["auth:delete:policy", "auth:admin:policy"]}>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => deletePolicy(policy)}
                            >
                                <HugeiconsIcon
                                    icon={Delete02Icon}
                                    strokeWidth={2}
                                />
                                <span>Delete</span>
                            </Button>
                        </Can>
                    </div>
                </div>

                <dl className="text-sm">
                    <InfoRow label="Name">{policy.name}</InfoRow>
                    <InfoRow label="Reference Name">{policy.ref_name}</InfoRow>
                    <InfoRow label="Description">
                        {policy.description ?? "-"}
                    </InfoRow>
                    <InfoRow label="Created">
                        {formatDate(policy.created_at)}
                    </InfoRow>
                    <InfoRow label="Last Updated">
                        {formatDate(policy.updated_at)}
                    </InfoRow>
                    <InfoRow label="Permissions">
                        <div className="flex flex-wrap gap-2">
                            {renderPermissionsContent()}
                        </div>
                    </InfoRow>
                </dl>
            </div>
        </>
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
