/**
 * Normalises a token expiry to absolute Unix epoch **milliseconds**.
 *
 * The backend already returns milliseconds, but this guards against a future API
 * change to seconds: any value below ~Sat 2001 in ms is assumed to be seconds and
 * scaled up. A missing value falls back to "now" (treated as already expired).
 */
export function normalizeExpiresAt(expiresAt?: number): number {
    if (!expiresAt) return Date.now()
    return expiresAt < 1_000_000_000_000 ? expiresAt * 1000 : expiresAt
}
