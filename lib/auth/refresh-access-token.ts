import { refreshAccessToken as refreshTokenRequest } from "@/services/auth.service"
import { type JWT } from "next-auth/jwt"
import timeNow from "../time-now"
import { AUTH_ERROR } from "./errors"
import { normalizeExpiresAt } from "./normalize-expires"

/** Refresh the access token this many ms *before* it actually expires, so a
 * request never goes out with an already-dead token. */
export const REFRESH_BUFFER_MS = 30_000

// --- Single-flight lock -----------------------------------------------------
// Concurrent session reads (multiple tabs, parallel server components) would each
// try to refresh with the *same* refresh token. Because the backend rotates
// refresh tokens single-use, only the first would succeed and the rest would get
// a 403 and be logged out. This module-level lock collapses concurrent refreshes
// for the same refresh token into one shared in-flight promise.
//
// NOTE: the lock is per-process. It fully protects a single Node server (the
// `next start` deployment this app uses). Under serverless/multi-instance
// hosting it can't dedupe across instances — a shared store (e.g. Redis) would be
// needed there.
let refreshPromise: Promise<JWT> | null = null
let refreshLockToken: string | null = null

export async function refreshAccessToken(token: JWT): Promise<JWT> {
    const currentRefreshToken = token.tokens?.refresh?.value
    if (!currentRefreshToken) {
        return { ...token, error: AUTH_ERROR.MissingRefreshToken }
    }

    // Reuse the in-flight refresh if one is already running for this same token.
    if (refreshPromise && refreshLockToken === currentRefreshToken) {
        return refreshPromise
    }

    refreshLockToken = currentRefreshToken
    refreshPromise = performRefresh(token, currentRefreshToken)

    return refreshPromise
}

async function performRefresh(token: JWT, currentRefreshToken: string): Promise<JWT> {
    try {
        const data = await refreshTokenRequest(currentRefreshToken, token.api_key)

        return {
            ...token,
            user: data.user ?? token.user,
            permissions: data.permissions ?? token.permissions,
            api_key: token.api_key,
            tokens: {
                access: {
                    value: data.tokens.access.value,
                    expires_at: normalizeExpiresAt(data.tokens.access.expires_at),
                },
                refresh: {
                    value: data.tokens.refresh.value,
                    expires_at: normalizeExpiresAt(data.tokens.refresh.expires_at),
                },
            },
            error: undefined,
        }
    } catch (error) {
        console.warn(
            `[${timeNow()}] Token refresh failed: ${
                error instanceof Error ? error.message : String(error)
            }`
        )
        return { ...token, error: AUTH_ERROR.RefreshAccessTokenError }
    } finally {
        // Keep the resolved promise around briefly so stragglers that were racing
        // the same refresh reuse the *result* instead of firing a second request
        // with the now-rotated (and therefore invalid) old refresh token.
        setTimeout(() => {
            refreshPromise = null
            refreshLockToken = null
        }, 5_000)
    }
}
