import { authOptions } from "@/lib/next-auth"
import { isForbiddenError } from "@/services/http/fetcher"
import { getServerSession } from "next-auth/next"

interface AccessResult<T> {
    data: T
    allowed: boolean
}

interface AuthCredentials {
    accessToken: string
    apiKey: string
}

/**
 * Runs a server-side fetch against the auth service under the current
 * session's credentials. Requests the BE rejects with 403 are treated as
 * "not allowed" rather than an error, so pages can render with partial data
 * and let the BE's permission check be the single source of truth.
 */
export async function fetchWithAccessResult<T>(
    fetchFn: (auth: AuthCredentials) => Promise<T>,
    fallback: T
): Promise<AccessResult<T>> {
    const session = await getServerSession(authOptions)

    if (!session?.access_token || !session.api_key) {
        throw new Error("Unauthorized")
    }

    try {
        const data = await fetchFn({
            accessToken: session.access_token,
            apiKey: session.api_key,
        })
        return { data, allowed: true }
    } catch (error) {
        if (isForbiddenError(error)) {
            return { data: fallback, allowed: false }
        }
        throw error
    }
}
