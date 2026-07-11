import { ApiError } from "@/lib/api-error"

interface ApiErrorBody {
    message?: string
    errors?: unknown
}

export default async function http<T>(
    url: string,
    options?: RequestInit
): Promise<T> {
    const res = await fetch(url, options)
    const text = await res.text()

    let body: unknown
    try {
        body = text ? JSON.parse(text) : undefined
    } catch {
        body = undefined
    }

    if (!res.ok) {
        const errorBody = body as ApiErrorBody | undefined
        throw new ApiError(
            errorBody?.message ?? "Something went wrong",
            res.status,
            errorBody?.errors,
        )
    }

    return body as T
}

export function isForbiddenError(error: unknown): boolean {
    if(error instanceof ApiError){
        return error.statusCode === 403
    }

    return false
}
