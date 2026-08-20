import { type NextAuthOptions } from "next-auth"
import timeNow from "../time-now"
import { normalizeExpiresAt } from "./normalize-expires"
import { REFRESH_BUFFER_MS, refreshAccessToken } from "./refresh-access-token"

type Callbacks = NonNullable<NextAuthOptions["callbacks"]>

/**
 * Runs on every session read. On login it seeds the token from the authorized
 * user; on subsequent reads it returns the token untouched while the access token
 * is still fresh, and transparently refreshes it once it's within
 * `REFRESH_BUFFER_MS` of expiry. Refresh failures come back as a token carrying an
 * `error`, which `SessionWatcher` turns into a sign-out.
 */
export const jwtCallback: Callbacks["jwt"] = async ({ token, user }) => {
    // Initial sign-in: copy everything off the authorized user onto the token.
    if (user) {
        return {
            ...token,
            user: user.user,
            api_key: user.api_key,
            permissions: user.permissions,
            tokens: {
                access: {
                    value: user.tokens.access.value,
                    expires_at: normalizeExpiresAt(user.tokens.access.expires_at),
                },
                refresh: {
                    value: user.tokens.refresh.value,
                    expires_at: normalizeExpiresAt(user.tokens.refresh.expires_at),
                },
            },
        }
    }

    // No access token to reason about — nothing to refresh.
    if (!token.tokens?.access?.expires_at) return token

    const accessTokenExpires = normalizeExpiresAt(token.tokens.access.expires_at)

    // Still comfortably valid — hand it back as-is.
    if (Date.now() < accessTokenExpires - REFRESH_BUFFER_MS) return token

    // Expired or about to expire — refresh (self-contained error handling).
    const refreshed = await refreshAccessToken(token)

    if (refreshed.error) {
        console.warn(`[${timeNow()}] Token refresh failed for user ${token.user?.email}`)
    }

    return refreshed
}

/**
 * Projects the fields the app needs from the (server-only) token onto the session
 * object the client receives. `access_token` is read server-side by the internal
 * `/api/*` proxy routes; `error` lets the client trigger re-login.
 */
export const sessionCallback: Callbacks["session"] = async ({ session, token }) => {
    session.user = token.user
    session.api_key = token.api_key
    session.access_token = token.tokens?.access?.value ?? ""
    session.permissions = token.permissions

    if (token.error) {
        session.error = token.error
    }

    return session
}
