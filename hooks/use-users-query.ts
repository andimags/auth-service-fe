import { type UserDto } from "@/dtos"
import {
    keepPreviousData,
    useQuery,
    type UseQueryOptions,
    type UseQueryResult,
} from "@tanstack/react-query"

export interface UsersQueryParams {
    page: number
    size: number
    search?: string
    status?: string
    sortField?: string
    sortDesc?: boolean
}

export interface UsersQueryResponse {
    count: number
    rows: UserDto[]
    totalPages: number
    currentPage: number
}

export const usersQueryKeys = {
    all: ["users"] as const,
    list: (
        page: number,
        size: number,
        search?: string,
        status?: string,
        sortField?: string,
        sortDesc?: boolean
    ) =>
        [
            "users",
            "list",
            page,
            size,
            search ?? "",
            status ?? "",
            sortField ?? "",
            sortDesc ?? false,
        ] as const,
}

async function fetchUsers(
    params: UsersQueryParams
): Promise<UsersQueryResponse> {
    const searchParams = new URLSearchParams()
    searchParams.set("page", String(params.page))
    searchParams.set("size", String(params.size))

    if (params.search) {
        searchParams.set("search", params.search)
    }

    if (params.status) {
        searchParams.set("status", params.status)
    }

    if (params.sortField) {
        searchParams.set("sort_field", params.sortField)
    }

    if (typeof params.sortDesc === "boolean") {
        searchParams.set("sort_desc", String(params.sortDesc))
    }

    const response = await fetch(`/api/users?${searchParams.toString()}`, {
        cache: "no-store",
    })

    if (!response.ok) {
        throw new Error("Failed to fetch users")
    }

    return response.json()
}

export function useUsersQuery(
    params: UsersQueryParams,
    options?: Partial<
        UseQueryOptions<UsersQueryResponse, Error, UsersQueryResponse, readonly unknown[]>
    >
): UseQueryResult<UsersQueryResponse, Error> {
    return useQuery<UsersQueryResponse, Error>({
        queryKey: usersQueryKeys.list(
            params.page,
            params.size,
            params.search,
            params.status,
            params.sortField,
            params.sortDesc
        ),
        queryFn: () => fetchUsers(params),
        placeholderData: keepPreviousData,
        ...options,
    })
}
