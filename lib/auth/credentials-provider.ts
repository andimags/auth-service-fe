import { loginWithCredentials } from "@/services/auth.service"
import CredentialsProvider from "next-auth/providers/credentials"
import { normalizeExpiresAt } from "./normalize-expires"

/**
 * Email/password/api-key login. `authorize` calls the backend's generate-token
 * endpoint and, on success, returns the user + tokens that the `jwt` callback
 * then persists onto the NextAuth token. Returning `null` makes NextAuth report a
 * generic credentials error to the login form.
 */
export const credentialsProvider = CredentialsProvider({
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
                        expires_at: normalizeExpiresAt(data.tokens.access.expires_at),
                    },
                    refresh: {
                        value: data.tokens.refresh.value,
                        expires_at: normalizeExpiresAt(data.tokens.refresh.expires_at),
                    },
                },
            }
        } catch {
            return null
        }
    },
})
