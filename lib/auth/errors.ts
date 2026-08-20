/**
 * Auth error codes surfaced on the NextAuth token/session (`token.error` →
 * `session.error`). Centralised so the refresh logic that *sets* them and the
 * `SessionWatcher` that *reacts* to them can't drift apart — previously the
 * watcher only signed out on a subset of the codes the refresh logic could emit,
 * so e.g. a missing refresh token left the user stuck in a broken session.
 */
export const AUTH_ERROR = {
    /** Refresh request failed (network error, rotation race, invalid token, …). */
    RefreshAccessTokenError: "RefreshAccessTokenError",
    /** The token carried no refresh token to refresh with. */
    MissingRefreshToken: "MissingRefreshToken",
} as const

export type AuthErrorCode = (typeof AUTH_ERROR)[keyof typeof AUTH_ERROR]

/** True for any error that means the session can't be recovered and the user
 * must re-authenticate. `SessionWatcher` uses this to decide when to sign out. */
export function isUnrecoverableAuthError(error?: string): boolean {
    return (
        error === AUTH_ERROR.RefreshAccessTokenError ||
        error === AUTH_ERROR.MissingRefreshToken
    )
}
