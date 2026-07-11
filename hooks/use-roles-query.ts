import { type RoleDto } from "@/dtos"
import {
    keepPreviousData,
    useQuery,
    type UseQueryOptions,
    type UseQueryResult,
} from "@tanstack/react-query"

export interface RolesQueryParams {
    page: number
    size: number
    search?: string
    scope?: string
    sortField?: string
    sortDesc?: boolean
}

export interface RolesQueryResponse {
    count: number
    rows: RoleDto[]
    totalPages: number
    currentPage: number
}

export const rolesQueryKeys = {
    all: ["roles"] as const,
    list: (
        page: number,
        size: number,
        search?: string,
        scope?: string,
        sortField?: string,
        sortDesc?: boolean
    ) =>
        [
            "roles",
            "list",
            page,
            size,
            search ?? "",
            scope ?? "",
            sortField ?? "",
            sortDesc ?? false,
        ] as const,
}

async function fetchRoles(
    params: RolesQueryParams
): Promise<RolesQueryResponse> {
    const searchParams = new URLSearchParams()
    searchParams.set("page", String(params.page))
    searchParams.set("size", String(params.size))

    if (params.search) {
        searchParams.set("search", params.search)
    }

    if (params.scope) {
        searchParams.set("scope", params.scope)
    }

    if (params.sortField) {
        searchParams.set("sort_field", params.sortField)
    }

    if (typeof params.sortDesc === "boolean") {
        searchParams.set("sort_desc", String(params.sortDesc))
    }

    const response = await fetch(`/api/roles?${searchParams.toString()}`, {
        cache: "no-store",
    })

    if (!response.ok) {
        throw new Error("Failed to fetch roles")
    }

    return response.json()
}

export function useRolesQuery(
    params: RolesQueryParams,
    options?: Partial<
        UseQueryOptions<RolesQueryResponse, Error, RolesQueryResponse, readonly unknown[]>
    >
): UseQueryResult<RolesQueryResponse, Error> {
    return useQuery<RolesQueryResponse, Error>({
        queryKey: rolesQueryKeys.list(
            params.page,
            params.size,
            params.search,
            params.scope,
            params.sortField,
            params.sortDesc
        ),
        queryFn: () => fetchRoles(params),
        placeholderData: keepPreviousData,
        ...options,
    })
}
