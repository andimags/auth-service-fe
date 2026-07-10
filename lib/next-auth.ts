import {
    destroyToken,
    loginWithCredentials,
    refreshAccessToken as refreshTokenRequest,
} from "@/services/auth.service"
import { type NextAuthOptions } from "next-auth"
import { type JWT } from "next-auth/jwt"
import CredentialsProvider from "next-auth/providers/credentials"
import timeNow from "./time-now"

const REFRESH_BUFFER_MS = 30_000

// Your API always returns ms timestamps, but keep this as a safety net
function normalizeExpiresAt(expiresAt?: number): number {
    if (!expiresAt) return Date.now()
    // Convert seconds → ms only if needed (safety net for future API changes)
    return expiresAt < 1_000_000_000_000 ? expiresAt * 1000 : expiresAt
}

// --- Refresh lock to prevent race conditions ---
let refreshPromise: Promise<JWT> | null = null
let refreshLockToken: string | null = null

async function refreshAccessToken(token: JWT): Promise<JWT> {
    if (!token.tokens?.refresh?.value) {
        return { ...token, error: "MissingRefreshToken" }
    }

    // Use the refresh token value as the lock key
    const currentRefreshToken = token.tokens.refresh.value

    // If a refresh is already in flight for this same refresh token, reuse it
    if (refreshPromise && refreshLockToken === currentRefreshToken) {
        return refreshPromise
    }

    refreshLockToken = currentRefreshToken
    refreshPromise = (async (): Promise<JWT> => {
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
                        expires_at: normalizeExpiresAt(
                            data.tokens.access.expires_at
                        ),
                    },
                    refresh: {
                        value: data.tokens.refresh.value,
                        expires_at: normalizeExpiresAt(
                            data.tokens.refresh.expires_at
                        ),
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
            return { ...token, error: "RefreshAccessTokenError" }
        } finally {
            // Clear the lock after a short delay so subsequent calls
            // (with the new token) don't incorrectly reuse this promise
            setTimeout(() => {
                refreshPromise = null
                refreshLockToken = null
            }, 5_000)
        }
    })()

    return refreshPromise
}

const credentialsProvider = CredentialsProvider({
    id: "credentials",
    name: "Credentials",
    credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
        api_key: { label: "API Key", type: "password" },
    },
    async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null

        try {
            const data = await loginWithCredentials({
                email: credentials.email,
                password: credentials.password,
                apiKey: credentials.api_key,
            })

            if (!data?.tokens?.access?.value || !data?.user) return null

            return {
                id: String(data.user.id),
                name: `${data.user.first_name} ${data.user.last_name}`,
                email: data.user.email,
                user: data.user,
                permissions: data.permissions,
                api_key: credentials.api_key,
                tokens: {
                    access: {
                        value: data.tokens.access.value,
                        expires_at: normalizeExpiresAt(
                            data.tokens.access.expires_at
                        ),
                    },
                    refresh: {
                        value: data.tokens.refresh.value,
                        expires_at: normalizeExpiresAt(
                            data.tokens.refresh.expires_at
                        ),
                    },
                },
            }
        } catch {
            return null
        }
    },
})

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
        async jwt({ token, user }) {
            if (user) {
                return {
                    ...token,
                    user: user.user,
                    api_key: user.api_key,
                    permissions: user.permissions,
                    tokens: {
                        access: {
                            value: user.tokens.access.value,
                            expires_at: normalizeExpiresAt(
                                user.tokens.access.expires_at
                            ),
                        },
                        refresh: {
                            value: user.tokens.refresh.value,
                            expires_at: normalizeExpiresAt(
                                user.tokens.refresh.expires_at
                            ),
                        },
                    },
                }
            }

            if (!token.tokens?.access?.expires_at) {
                return token
            }

            const accessTokenExpires = normalizeExpiresAt(
                token.tokens.access.expires_at
            )

            // Token still valid — return as-is
            if (Date.now() < accessTokenExpires - REFRESH_BUFFER_MS) {
                return token
            }

            // Token expired or about to — refresh it
            try {
                const newRefreshAccessToken = await refreshAccessToken(token)
                
                // If the refresh failed (returned same token with error), log it safely
                if (newRefreshAccessToken.error) {
                    console.warn(`[${timeNow()}] Token refresh failed for user ${token.user?.email}`)
                    return newRefreshAccessToken
                }

                return newRefreshAccessToken
            } catch (error) {
                console.warn(
                    `[${timeNow()}] Critical error in JWT refresh callback: ${
                        error instanceof Error ? error.message : String(error)
                    }`
                )
                return { ...token, error: "RefreshAccessTokenError" }
            }
        },

        async session({ session, token }) {
            session.user = token.user
            session.api_key = token.api_key
            session.access_token = token.tokens?.access?.value ?? ""
            session.permissions = token.permissions

            // Expose error to client so it can trigger re-login
            if (token.error) {
                session.error = token.error
            }

            return session
        },
    },
    events: {
        signOut: async ({token}) => {
            await destroyToken(token.tokens.refresh.value)
        }
    },
    debug: process.env.NODE_ENV === "development",
}
