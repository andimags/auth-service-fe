"use client"

import { Can } from "@/components/shared/Can"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { NAVIGATE_AWAY_DELAY_MS, REFRESH_DELAY_MS } from "@/constants/ui"
import { PolicyDto, RoleDto, RolePolicyDto } from "@/dtos"
import { useDeleteRole } from "@/hooks/use-delete-role"
import useRoleFormDialog from "@/hooks/use-role-form-dialog"
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
import { ManagePoliciesDialog } from "./ManagePoliciesDialog"

interface RoleInformationProps {
    role: RoleDto
    rolePolicies: RolePolicyDto[]
    policies: PolicyDto[]
    canViewPolicies: boolean
    canViewRolePolicies: boolean
    canManagePolicies: boolean
}

export default function RoleInformation({
    role,
    rolePolicies,
    policies,
    canViewPolicies,
    canViewRolePolicies,
    canManagePolicies,
}: Readonly<RoleInformationProps>) {
    const [isOpen, setIsOpen] = useState(false)
    const roleFormDialog = useRoleFormDialog()
    const router = useRouter()

    const { deleteRole } = useDeleteRole({
        onSuccess: () => {
            setTimeout(() => router.push("/roles"), NAVIGATE_AWAY_DELAY_MS)
        },
    })

    const handleEditRole = () => {
        roleFormDialog.open.edit(role, () => {
            roleFormDialog.close()
            setTimeout(() => router.refresh(), REFRESH_DELAY_MS)
        })
    }

    const handleManagePolicies = () => {
        setIsOpen(true)
    }

    const selectedValues = rolePolicies.map((policy) => policy.ref_name)

    const policyOptions = policies.map((policy) => ({
        label: `${policy.ref_name} | ${policy.name}`,
        value: policy.ref_name,
    }))

    const renderPoliciesContent = () => {
        if (!canViewRolePolicies || !canViewPolicies) {
            return (
                <span className="text-sm text-neutral-400 italic dark:text-neutral-500">
                    You do not have permission to view this role&apos;s policies.
                </span>
            )
        }

        if (rolePolicies.length === 0) {
            return (
                <span className="text-sm text-neutral-500 dark:text-neutral-400">
                    No policies assigned to this role
                </span>
            )
        }

        return rolePolicies.map((rolePolicy) => (
            <Link href={`/policies/${rolePolicy.id}`} key={rolePolicy.id}>
                <Badge variant="outline">{rolePolicy.ref_name}</Badge>
            </Link>
        ))
    }

    return (
        <>
            <ManagePoliciesDialog
                isOpen={isOpen}
                setIsOpen={setIsOpen}
                options={policyOptions}
                selectedValues={selectedValues}
                role={role}
            />
            <div className="mx-auto w-full max-w-6xl text-neutral-900 transition-colors duration-200 dark:text-neutral-100">
                <div className="flex items-start justify-between pb-6">
                    <div>
                        <h2 className="text-xl font-semibold tracking-tight text-neutral-900 dark:text-white">
                            Role Information
                        </h2>
                        <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
                            Role details and attached policies.
                        </p>
                    </div>
                    <div className="flex gap-2">
                        <Can requiredPermission={["auth:update:role", "auth:admin:role"]}>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={handleEditRole}
                            >
                                <HugeiconsIcon
                                    icon={PencilEdit01Icon}
                                    strokeWidth={2}
                                />
                                <span>Edit Role</span>
                            </Button>
                        </Can>
                        {canManagePolicies && (
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={handleManagePolicies}
                            >
                                <HugeiconsIcon
                                    icon={ShieldUserIcon}
                                    strokeWidth={2}
                                />
                                <span>Manage Policies</span>
                            </Button>
                        )}
                        <Can requiredPermission={["auth:delete:role", "auth:admin:role"]}>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => deleteRole(role)}
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
                    <InfoRow label="Name">{role.name}</InfoRow>
                    <InfoRow label="Reference Name">{role.ref_name}</InfoRow>
                    <InfoRow label="Description">
                        {role.description ?? "-"}
                    </InfoRow>
                    <InfoRow label="Scope">{role.scope}</InfoRow>
                    <InfoRow label="Channel Ref Name">
                        {role.channel?.ref_name ?? "-"}
                    </InfoRow>
                    <InfoRow label="Created">
                        {formatDate(role.created_at)}
                    </InfoRow>
                    <InfoRow label="Last Updated">
                        {formatDate(role.updated_at)}
                    </InfoRow>
                    <InfoRow label="Policies">
                        <div className="flex flex-wrap gap-2">
                            {renderPoliciesContent()}
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
