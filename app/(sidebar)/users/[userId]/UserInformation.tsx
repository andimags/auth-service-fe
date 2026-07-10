"use client"

import { Can } from "@/components/shared/Can"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { NAVIGATE_AWAY_DELAY_MS, REFRESH_DELAY_MS } from "@/constants/ui"
import { RoleDto, UserDto, UserRolesDto } from "@/dtos"
import { useDeleteUser } from "@/hooks/use-delete-user"
import useUserFormDialog from "@/hooks/use-user-form-dialog"
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
import { ManageRolesDialog } from "./ManageRolesDialog"

interface UserInformationProps {
    user: UserDto
    userRoles?: UserRolesDto[]
    roles?: RoleDto[]
    canViewRoles: boolean
    canViewUserRoles: boolean
    canManageRoles: boolean
}

export default function UserInformation({
    user,
    userRoles = [],
    roles = [],
    canViewRoles,
    canViewUserRoles,
    canManageRoles,
}: Readonly<UserInformationProps>) {
    const [isOpen, setIsOpen] = useState(false)

    const userFormDialog = useUserFormDialog()
    const router = useRouter()

    const { deleteUser } = useDeleteUser({
        onSuccess: () => {
            setTimeout(() => router.push("/users"), NAVIGATE_AWAY_DELAY_MS)
        },
    })

    const handleEditUser = () => {
        userFormDialog.open.edit(user, () => {
            userFormDialog.close()
            setTimeout(() => router.refresh(), REFRESH_DELAY_MS)
        })
    }

    const handleManageRoles = () => {
        setIsOpen(true)
    }

    const selectedValues = userRoles.map((userRole) => userRole.ref_name)

    const roleOptions = roles.map((role) => ({
        label: `${role.ref_name} | ${role.scope}`,
        value: role.ref_name,
    }))

    const renderRolesContent = () => {
        if (!canViewUserRoles || !canViewRoles) {
            return (
                <span className="text-sm italic text-neutral-400 dark:text-neutral-500">
                    You do not have permission to view this user's roles.
                </span>
            )
        }

        if (userRoles.length === 0) {
            return (
                <span className="text-sm text-neutral-500 dark:text-neutral-400">
                    No roles assigned to this user
                </span>
            )
        }

        return userRoles.map((userRole) => (
            <Link href={`/roles/${userRole.id}`} key={userRole.id}>
                <Badge variant="outline">
                    {userRole.ref_name} | {userRole.scope}
                </Badge>
            </Link>
        ))
    }

    return (
        <>
            {canManageRoles && (
                <ManageRolesDialog
                    isOpen={isOpen}
                    setIsOpen={setIsOpen}
                    options={roleOptions}
                    selectedValues={selectedValues}
                    user={user}
                />
            )}

            <div className="mx-auto w-full max-w-6xl text-neutral-900 transition-colors duration-200 dark:text-neutral-100">
                <div className="flex items-start justify-between pb-6">
                    <div>
                        <h2 className="text-xl font-semibold tracking-tight text-neutral-900 dark:text-white">
                            User Information
                        </h2>
                        <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
                            Personal details and general information
                        </p>
                    </div>

                    <div className="flex gap-2">
                        <Can requiredPermission={["edit:user", "auth:admin:user"]}>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={handleEditUser}
                            >
                                <HugeiconsIcon
                                    icon={PencilEdit01Icon}
                                    strokeWidth={2}
                                />
                                <span>Edit User</span>
                            </Button>
                        </Can>

                        {canManageRoles && (
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={handleManageRoles}
                            >
                                <HugeiconsIcon
                                    icon={ShieldUserIcon}
                                    strokeWidth={2}
                                />
                                <span>Manage Roles</span>
                            </Button>
                        )}

                        <Can requiredPermission={["auth:delete:user", "auth:admin:user"]}>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => deleteUser(user)}
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
                    <InfoRow label="Full name">
                        {user.last_name}, {user.first_name}
                    </InfoRow>

                    <InfoRow label="Username">{user.username}</InfoRow>

                    <InfoRow label="Email address">{user.email}</InfoRow>

                    <InfoRow label="Status">{user.status}</InfoRow>

                    <InfoRow label="Level">{user.level}</InfoRow>

                    <InfoRow label="Created">
                        {formatDate(user.created_at)}
                    </InfoRow>

                    <InfoRow label="Last Updated">
                        {formatDate(user.updated_at)}
                    </InfoRow>

                    <InfoRow label="Roles">
                        <div className="flex flex-wrap gap-2">
                            {renderRolesContent()}
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
