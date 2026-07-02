"use client"

import { RoleDto } from "@/dtos"
import useConfirmDialog from "@/hooks/use-confirm-dialog"
import { getBaseUrl } from "@/lib/api"
import { useQueryClient } from "@tanstack/react-query"
import { useCallback } from "react"
import { toast } from "sonner"

interface UseDeleteRoleOptions {
    onSuccess?: () => void
}

export function useDeleteRole({ onSuccess }: UseDeleteRoleOptions = {}) {
    const confirm = useConfirmDialog()
    const queryClient = useQueryClient()
    const baseUrl = getBaseUrl()

    const deleteRole = useCallback(
        async (role: RoleDto) => {
            await confirm({
                title: "Delete Role?",
                description: "This action cannot be undone.",
                onConfirm: async () => {
                    try {
                        const response = await fetch(
                            `${baseUrl}/api/roles/${role.id}`,
                            {
                                method: "DELETE",
                                headers: { "Content-Type": "application/json" },
                            }
                        )

                        if (response.ok) {
                            toast.success("Role has been deleted")
                            queryClient.invalidateQueries({
                                queryKey: ["roles"],
                            })
                            onSuccess?.()
                        } else {
                            const error = await response.json()
                            toast.warning(error.message || "Failed to delete role")
                        }
                    } catch (error) {
                        console.warn(error)
                        toast.error("Network error. Please try again.")
                    }
                },
            })
        },
        [confirm, queryClient, baseUrl, onSuccess]
    )

    return { deleteRole }
}
