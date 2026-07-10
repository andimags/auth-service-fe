import { ApiError } from "@/lib/api-error"
import http from "@/services/http/fetcher"
import { useMutation, useQueryClient, type UseMutationResult } from "@tanstack/react-query"
import { toast } from "sonner"

interface UseEntityFormMutationOptions {
    /** Singular display name used in toast messages, e.g. "User". */
    entityName: string
    /** React Query key this entity's list queries are cached under, e.g. "users". */
    queryKey: string
    mode: "create" | "edit"
    createUrl: string
    updateUrl: string
    /** Called on success, after the toast/invalidation — typically closes the dialog. */
    onSuccess: () => void
    /** Called only after a successful update (not create), so the parent can refresh its data. */
    onUpdateSuccess?: () => void
}

/**
 * Shared create/update submit logic for the entity form dialogs (user, role,
 * permission, policy, channel). They all POST/PUT to a Next API route,
 * toast on success/failure, and invalidate that entity's list query — this
 * was duplicated near-verbatim across all five dialogs.
 */
export function useEntityFormMutation<TPayload>({
    entityName,
    queryKey,
    mode,
    createUrl,
    updateUrl,
    onSuccess,
    onUpdateSuccess,
}: UseEntityFormMutationOptions): UseMutationResult<unknown, unknown, TPayload> {
    const queryClient = useQueryClient()
    const isCreate = mode === "create"

    return useMutation({
        mutationFn: (payload: TPayload) =>
            http(isCreate ? createUrl : updateUrl, {
                method: isCreate ? "POST" : "PUT",
                body: JSON.stringify(payload),
                headers: { "Content-Type": "application/json" },
            }),
        onSuccess: () => {
            toast.success(`${entityName} has been ${isCreate ? "created" : "updated"}`)
            queryClient.invalidateQueries({ queryKey: [queryKey] })
            onSuccess()
            if (!isCreate) onUpdateSuccess?.()
        },
        onError: (error: unknown) => {
            if (error instanceof ApiError) {
                toast.warning(
                    error.message ||
                        `Failed to ${isCreate ? "create" : "update"} ${entityName.toLowerCase()}`
                )
            } else {
                toast.error("Network error. Please try again.")
            }
        },
    })
}
