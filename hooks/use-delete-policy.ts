"use client"

import { PolicyDto } from "@/dtos"
import useConfirmDialog from "@/hooks/use-confirm-dialog"
import { getBaseUrl } from "@/lib/api"
import { useQueryClient } from "@tanstack/react-query"
import { useCallback } from "react"
import { toast } from "sonner"

interface UseDeletePolicyOptions {
    onSuccess?: () => void
}

export function useDeletePolicy({ onSuccess }: UseDeletePolicyOptions = {}) {
    const confirm = useConfirmDialog()
    const queryClient = useQueryClient()
    const baseUrl = getBaseUrl()

    const deletePolicy = useCallback(
        async (policy: PolicyDto) => {
            await confirm({
                title: "Delete Policy?",
                description: "This action cannot be undone.",
                onConfirm: async () => {
                    try {
                        const response = await fetch(
                            `${baseUrl}/api/policies/${policy.id}`,
                            {
                                method: "DELETE",
                                headers: { "Content-Type": "application/json" },
                            }
                        )

                        if (response.ok) {
                            toast.success("Policy has been deleted")
                            queryClient.invalidateQueries({
                                queryKey: ["policies"],
                            })
                            onSuccess?.()
                        } else {
                            const error = await response.json()
                            toast.warning(error.message || "Failed to delete policy")
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

    return { deletePolicy }
}
