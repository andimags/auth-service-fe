import { type ChannelDto } from "@/dtos"
import {
    keepPreviousData,
    useQuery,
    type UseQueryOptions,
    type UseQueryResult,
} from "@tanstack/react-query"

export interface ChannelsQueryParams {
    page: number
    size: number
    search?: string
    sortField?: string
    sortDesc?: boolean
}

export interface ChannelsQueryResponse {
    count: number
    rows: ChannelDto[]
    totalPages: number
    currentPage: number
}

export const channelsQueryKeys = {
    all: ["channels"] as const,
    list: (
        page: number,
        size: number,
        search?: string,
        sortField?: string,
        sortDesc?: boolean
    ) =>
        [
            "channels",
            "list",
            page,
            size,
            search ?? "",
            sortField ?? "",
            sortDesc ?? false,
        ] as const,
}

async function fetchChannels(
    params: ChannelsQueryParams
): Promise<ChannelsQueryResponse> {
    const searchParams = new URLSearchParams()
    searchParams.set("page", String(params.page))
    searchParams.set("size", String(params.size))

    if (params.search) {
        searchParams.set("search", params.search)
    }

    if (params.sortField) {
        searchParams.set("sort_field", params.sortField)
    }

    if (typeof params.sortDesc === "boolean") {
        searchParams.set("sort_desc", String(params.sortDesc))
    }

    const response = await fetch(`/api/channels?${searchParams.toString()}`, {
        cache: "no-store",
    })
    return response.json()
}

export function useChannelsQuery(
    params: ChannelsQueryParams,
    options?: Partial<
        UseQueryOptions<ChannelsQueryResponse, Error, ChannelsQueryResponse, readonly unknown[]>
    >
): UseQueryResult<ChannelsQueryResponse, Error> {
    return useQuery<ChannelsQueryResponse, Error>({
        queryKey: channelsQueryKeys.list(
            params.page,
            params.size,
            params.search,
            params.sortField,
            params.sortDesc
        ),
        queryFn: () => fetchChannels(params),
        placeholderData: keepPreviousData,
        ...options,
    })
}
