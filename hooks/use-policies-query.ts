import { type PolicyDto } from "@/dtos"
import {
    keepPreviousData,
    useQuery,
    type UseQueryOptions,
    type UseQueryResult,
} from "@tanstack/react-query"

export interface PoliciesQueryParams {
    page: number
    size: number
    search?: string
    isSystem?: string
    sortField?: string
    sortDesc?: boolean
}

export interface PoliciesQueryResponse {
    count: number
    rows: PolicyDto[]
    totalPages: number
    currentPage: number
}

export const policiesQueryKeys = {
    all: ["policies"] as const,
    list: (
        page: number,
        size: number,
        search?: string,
        is_system?: string,
        sortField?: string,
        sortDesc?: boolean
    ) =>
        [
            "policies",
            "list",
            page,
            size,
            search ?? "",
            is_system ?? "",
            sortField ?? "",
            sortDesc ?? false,
        ] as const,
}

async function fetchPolicies(
    params: PoliciesQueryParams
): Promise<PoliciesQueryResponse> {
    const searchParams = new URLSearchParams()
    searchParams.set("page", String(params.page))
    searchParams.set("size", String(params.size))

    if (params.search) {
        searchParams.set("search", params.search)
    }

    if (params.isSystem) {
        searchParams.set("is_system", params.isSystem)
    }

    if (params.sortField) {
        searchParams.set("sort_field", params.sortField)
    }

    if (typeof params.sortDesc === "boolean") {
        searchParams.set("sort_desc", String(params.sortDesc))
    }

    const response = await fetch(`/api/policies?${searchParams.toString()}`, {
        cache: "no-store",
    })

    if (!response.ok) {
        throw new Error("Failed to fetch policies")
    }

    return response.json()
}

export function usePoliciesQuery(
    params: PoliciesQueryParams,
    options?: Partial<
        UseQueryOptions<PoliciesQueryResponse, Error, PoliciesQueryResponse, readonly unknown[]>
    >
): UseQueryResult<PoliciesQueryResponse, Error> {
    return useQuery<PoliciesQueryResponse, Error>({
        queryKey: policiesQueryKeys.list(
            params.page,
            params.size,
            params.search,
            params.isSystem,
            params.sortField,
            params.sortDesc
        ),
        queryFn: () => fetchPolicies(params),
        placeholderData: keepPreviousData,
        ...options,
    })
}
