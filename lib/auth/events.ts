import { destroyToken } from "@/services/auth.service"
import { type NextAuthOptions } from "next-auth"
import timeNow from "../time-now"

type Events = NonNullable<NextAuthOptions["events"]>

/**
 * On sign-out, best-effort revoke the refresh token on the backend so it can't be
 * replayed. Guarded: a token that already errored (e.g. failed refresh) may have
 * no refresh value, and a network failure here must not block the local sign-out.
 */
export const signOutEvent: Events["signOut"] = async ({ token }) => {
    const refreshToken = token?.tokens?.refresh?.value
    if (!refreshToken) return

    try {
        await destroyToken(refreshToken, token.api_key)
    } catch (error) {
        console.warn(
            `[${timeNow()}] Failed to revoke refresh token on sign-out: ${
                error instanceof Error ? error.message : String(error)
            }`
        )
    }
}
