import { ApiFetchError } from "./apiFetch";

/**
 * Turns an ApiFetchError into a message worth showing the user, distinct
 * per failure kind instead of one generic "an error occurred". Falls back
 * to a generic message (and returns `fallback ?? true`) for anything else,
 * so callers can still branch on whether it was a user-initiated cancel.
 */
export default function describeApiFetchError(error: unknown, actionLabel: string): { message: string; wasCancelled: boolean } {
    if (error instanceof ApiFetchError) {
        switch (error.kind) {
            case "aborted":
                return { message: `${actionLabel}: Cancelled`, wasCancelled: true };
            case "timeout":
                return { message: `${actionLabel}: Timed out waiting for the server. Check your connection or endpoint setting.`, wasCancelled: false };
            case "network":
                return { message: `${actionLabel}: Could not reach the server. Check your connection or endpoint setting.`, wasCancelled: false };
        }
    }
    return { message: `${actionLabel}: An unexpected error occurred.`, wasCancelled: false };
}
