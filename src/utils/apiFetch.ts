/**
 * Shared fetch wrapper for all Cloud Clipboard API calls. Deliberately has
 * no dependency on the "vscode" module so it stays unit-testable in
 * isolation — callers (which already import vscode) turn an ApiFetchError's
 * `kind` into a user-facing message.
 *
 * Adds three things the raw `fetch` calls in this extension didn't have:
 *  - A hard timeout, so a hung server can't block the UI forever even if
 *    the user never cancels.
 *  - Automatic retry (with backoff) for transient network failures —
 *    but never for a response the server actually sent (4xx/5xx), since
 *    retrying those is either pointless or unsafe (e.g. double-POST).
 *  - A `kind` on thrown errors so callers can show "server unreachable"
 *    vs "timed out" vs "cancelled" instead of one generic message.
 */

export type ApiFetchErrorKind = "timeout" | "network" | "aborted";

export class ApiFetchError extends Error {
    readonly kind: ApiFetchErrorKind;
    readonly cause?: unknown;

    constructor(kind: ApiFetchErrorKind, cause?: unknown) {
        super(`ApiFetchError: ${kind}`);
        this.name = "ApiFetchError";
        this.kind = kind;
        this.cause = cause;
    }
}

export interface ApiFetchOptions extends RequestInit {
    /** Milliseconds before the request is aborted as a timeout. Default 15000. */
    timeoutMs?: number;
    /** Max retry attempts for network-level failures (not HTTP error responses). Default 2. */
    maxRetries?: number;
    /** Base delay in ms for exponential backoff between retries. Default 400. */
    retryBaseDelayMs?: number;
    /** External abort signal (e.g. from a VS Code CancellationToken) that also cancels retries. */
    externalSignal?: AbortSignal;
}

function delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Fetches `url`, applying a timeout and retrying transient network failures.
 * Throws ApiFetchError on failure instead of returning; a resolved Response
 * (even a 4xx/5xx one) is returned as-is so callers keep handling status
 * codes exactly like before.
 */
export default async function apiFetch(url: string, options: ApiFetchOptions = {}): Promise<Response> {
    const { timeoutMs = 15000, maxRetries = 2, retryBaseDelayMs = 400, externalSignal, ...init } = options;

    let lastError: unknown;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
        if (externalSignal?.aborted) throw new ApiFetchError("aborted");

        const timeoutController = new AbortController();
        const timeoutId = setTimeout(() => timeoutController.abort(), timeoutMs);

        const onExternalAbort = () => timeoutController.abort();
        externalSignal?.addEventListener("abort", onExternalAbort);

        try {
            const response = await fetch(url, { ...init, signal: timeoutController.signal });
            return response;
        } catch (error: any) {
            if (externalSignal?.aborted) {
                throw new ApiFetchError("aborted", error);
            }
            if (error?.name === "AbortError") {
                lastError = new ApiFetchError("timeout", error);
            } else {
                lastError = new ApiFetchError("network", error);
            }

            const canRetry = attempt < maxRetries;
            if (!canRetry) throw lastError;

            await delay(retryBaseDelayMs * Math.pow(2, attempt));
        } finally {
            clearTimeout(timeoutId);
            externalSignal?.removeEventListener("abort", onExternalAbort);
        }
    }

    // Unreachable given the loop above always returns or throws, but keeps TS happy.
    throw lastError instanceof ApiFetchError ? lastError : new ApiFetchError("network", lastError);
}
