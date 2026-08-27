// URL.hostname returns IPv6 literals with brackets (e.g. "[::1]"), so both
// forms are listed to match regardless of how the caller wrote the endpoint.
const LOCAL_HOSTNAMES = new Set(["localhost", "127.0.0.1", "::1", "[::1]"]);

/**
 * Returns true if the given endpoint uses HTTPS, or is HTTP against a local
 * host (useful for local development). Any other scheme (plain HTTP against
 * a remote host, or an invalid URL) is rejected so clipboard content is
 * never sent in the clear over the network.
 */
export default function isSecureEndpoint(endpoint: string): boolean {
    try {
        const url = new URL(endpoint);
        if (url.protocol === "https:") return true;
        return url.protocol === "http:" && LOCAL_HOSTNAMES.has(url.hostname);
    } catch {
        return false;
    }
}
