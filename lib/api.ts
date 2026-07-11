/**
 * Returns the base URL for internal API calls.
 * Centralizes the environment variable resolution logic previously
 * duplicated across UserFormDialog, UsersDataTable, and UserInformation.
 */
export function getBaseUrl(): string {
    const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL

    if (!BASE_URL) {
        throw new Error(
            "Base URL is not defined. Please set NEXT_PUBLIC_BASE_URL environment variable."
        )
    }

    return BASE_URL
}

// NOTE: AGENTS.md's Backend URL Rule says AUTH_SERVICE_BASE_URL should only ever
// be read in next.config.ts (backend access should go exclusively through the
// /backend/* rewrite), but every services/*.service.ts file calls this function
// and hits AUTH_SERVICE_BASE_URL directly, bypassing that rewrite. This is a real,
// current deviation from the stated architecture rule, not a deliberate exception
// — see README "API Integration" section / ENGINEERING_AUDIT.md. Since
// AUTH_SERVICE_BASE_URL has no NEXT_PUBLIC_ prefix it's server-only either way, so
// there's no client-side secret-exposure risk today, but routing through the
// rewrite is what the codebase's own rules call for.
export function getAuthServiceBaseUrl(): string {
    const AUTH_SERVICE_BASE_URL = process.env.AUTH_SERVICE_BASE_URL

    if (!AUTH_SERVICE_BASE_URL) {
        throw new Error(
            "Auth Service Base URL is not defined. Please set AUTH_SERVICE_BASE_URL environment variable."
        )
    }

    return AUTH_SERVICE_BASE_URL
}
