const LOCAL_HOSTNAMES = new Set(["localhost", "127.0.0.1", "::1"]);

export default function isSecureEndpoint(endpoint: string): boolean {
    try {
        const url = new URL(endpoint);
        if (url.protocol === "https:") return true;
        return url.protocol === "http:" && LOCAL_HOSTNAMES.has(url.hostname);
    } catch {
        return false;
    }
}
