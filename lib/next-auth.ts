import { type NextAuthOptions } from "next-auth"
import { jwtCallback, sessionCallback } from "./auth/callbacks"
import { credentialsProvider } from "./auth/credentials-provider"
import { signOutEvent } from "./auth/events"

/**
 * NextAuth configuration for the auth-service frontend. The moving parts live in
 * `lib/auth/*`:
 *   - `credentials-provider` — email/password/api-key login against the backend
 *   - `callbacks`            — jwt (seed + silent refresh) and session projection
 *   - `refresh-access-token` — single-flight, rotation-aware token refresh
 *   - `events`              — refresh-token revocation on sign-out
 *   - `errors`              — shared error codes (also used by SessionWatcher)
 */
export const authOptions: NextAuthOptions = {
    providers: [credentialsProvider],
    secret: process.env.NEXTAUTH_SECRET,
    session: {
        strategy: "jwt",
        maxAge: 60 * 60 * 24,
        updateAge: 60,
    },
    pages: { signIn: "/login" },
    callbacks: {
        jwt: jwtCallback,
        session: sessionCallback,
    },
    events: {
        signOut: signOutEvent,
    },
    debug: process.env.NODE_ENV === "development",
}
