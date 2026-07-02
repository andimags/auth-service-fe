import { UserDto } from "@/dtos"
import useConfirmDialog from "@/hooks/use-confirm-dialog"
import { getBaseUrl } from "@/lib/api"
import { useQueryClient } from "@tanstack/react-query"
import { useCallback } from "react"
import { toast } from "sonner"

interface UseDeleteUserOptions {
    /** Called after a successful deletion. */
    onSuccess?: () => void
}

/**
 * Encapsulates the confirm → DELETE → feedback flow for deleting a user.
 * Eliminates the duplicated logic that previously lived in both
 * UsersDataTable and UserInformation.
 */
export function useDeleteUser({ onSuccess }: UseDeleteUserOptions = {}) {
    const confirm = useConfirmDialog()
    const queryClient = useQueryClient()
    const baseUrl = getBaseUrl()

    const deleteUser = useCallback(
        async (user: UserDto) => {
            await confirm({
                title: "Delete User?",
                description: "This action cannot be undone",
                onConfirm: async () => {
                    try {
                        const response = await fetch(
                            `${baseUrl}/api/users/${user.id}`,
                            {
                                method: "DELETE",
                                headers: { "Content-Type": "application/json" },
                            }
                        )

                        if (response.ok) {
                            toast.success("User has been deleted")
                            queryClient.invalidateQueries({
                                queryKey: ["users"],
                            })
                            onSuccess?.()
                        } else {
                            const error = await response.json()
                            toast.warning(error.message || "Failed to delete user")
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

    return { deleteUser }
}
