"use client"

import { PermissionDto } from "@/dtos"
import useConfirmDialog from "@/hooks/use-confirm-dialog"
import { getBaseUrl } from "@/lib/api"
import { useQueryClient } from "@tanstack/react-query"
import { useCallback } from "react"
import { toast } from "sonner"

interface UseDeletePermissionOptions {
    onSuccess?: () => void
}

export function useDeletePermission({
    onSuccess,
}: UseDeletePermissionOptions = {}) {
    const confirm = useConfirmDialog()
    const queryClient = useQueryClient()
    const baseUrl = getBaseUrl()

    const deletePermission = useCallback(
        async (permission: PermissionDto) => {
            await confirm({
                title: "Delete Permission?",
                description: "This action cannot be undone.",
                onConfirm: async () => {
                    try {
                        const response = await fetch(
                            `${baseUrl}/api/permissions/${permission.id}`,
                            {
                                method: "DELETE",
                                headers: { "Content-Type": "application/json" },
                            }
                        )

                        if (response.ok) {
                            toast.success("Permission has been deleted")
                            queryClient.invalidateQueries({
                                queryKey: ["permissions"],
                            })
                            onSuccess?.()
                        } else {
                            const error = await response.json()
                            toast.warning(
                                error.message || "Failed to delete permission"
                            )
                        }
                    } catch (error) {
                        console.warn(error)
                        toast.error("Network error. Please try again.")
                    }
                },
            })
        },
        [baseUrl, confirm, queryClient, onSuccess]
    )

    return { deletePermission }
}
