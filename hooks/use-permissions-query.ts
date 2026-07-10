import { type PermissionDto } from "@/dtos"
import {
    keepPreviousData,
    useQuery,
    type UseQueryOptions,
    type UseQueryResult,
} from "@tanstack/react-query"

export interface PermissionsQueryParams {
    page: number
    size: number
    search?: string
    accessLevel?: string
    module?: string
    sortField?: string
    sortDesc?: boolean
    isSystem?: string
}

export interface PermissionsQueryResponse {
    count: number
    rows: PermissionDto[]
    totalPages: number
    currentPage: number
}

export const permissionsQueryKeys = {
    all: ["permissions"] as const,
    list: (
        page: number,
        size: number,
        search?: string,
        accessLevel?: string,
        module?: string,
        sortField?: string,
        sortDesc?: boolean,
        isSystem?: string
    ) =>
        [
            "permissions",
            "list",
            page,
            size,
            search ?? "",
            accessLevel ?? "",
            module ?? "",
            sortField ?? "",
            sortDesc ?? false,
            isSystem ?? "",
        ] as const,
}

async function fetchPermissions(
    params: PermissionsQueryParams
): Promise<PermissionsQueryResponse> {
    const searchParams = new URLSearchParams()
    searchParams.set("page", String(params.page))
    searchParams.set("size", String(params.size))

    if (params.search) {
        searchParams.set("search", params.search)
    }

    if (params.accessLevel) {
        searchParams.set("access_level", params.accessLevel)
    }

    if (params.module) {
        searchParams.set("module", params.module)
    }

    if (params.sortField) {
        searchParams.set("sort_field", params.sortField)
    }

    if (typeof params.sortDesc === "boolean") {
        searchParams.set("sort_desc", String(params.sortDesc))
    }

    if (params.isSystem) {
        searchParams.set("is_system", params.isSystem)
    }

    const response = await fetch(
        `/api/permissions?${searchParams.toString()}`,
        {
            cache: "no-store",
        }
    )

    if (!response.ok) {
        throw new Error("Failed to fetch permissions")
    }

    return response.json()
}

export function usePermissionsQuery(
    params: PermissionsQueryParams,
    options?: Partial<
        UseQueryOptions<PermissionsQueryResponse, Error, PermissionsQueryResponse, readonly unknown[]>
    >
): UseQueryResult<PermissionsQueryResponse, Error> {
    return useQuery<PermissionsQueryResponse, Error>({
        queryKey: permissionsQueryKeys.list(
            params.page,
            params.size,
            params.search,
            params.accessLevel,
            params.module,
            params.sortField,
            params.sortDesc,
            params.isSystem
        ),
        queryFn: () => fetchPermissions(params),
        placeholderData: keepPreviousData,
        ...options,
    })
}
