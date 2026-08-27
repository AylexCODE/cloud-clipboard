import { gzipSync, gunzipSync } from "zlib";

/**
 * Compresses clipboard item content above a size threshold before upload,
 * using gzip + a marker prefix (same scheme the old encryption used) so
 * uncompressed docs from before this feature — or items under the
 * threshold — still round-trip untouched. The marker is shared with the
 * web UI's compressText/decompressText so content compressed by one client
 * decompresses correctly when read by the other.
 */
export const COMPRESSION_MARKER = "CCGZ1:";

/** Below this size, gzip + base64 overhead usually costs more than it saves. */
export const COMPRESSION_THRESHOLD_BYTES = 10 * 1024;

export function isCompressedPayload(content: string): boolean {
    return typeof content === "string" && content.startsWith(COMPRESSION_MARKER);
}

/** Compresses `content` if it's over the threshold and not already compressed; otherwise returns it unchanged. */
export function maybeCompress(content: string): string {
    if (isCompressedPayload(content)) return content;
    if (Buffer.byteLength(content, "utf-8") <= COMPRESSION_THRESHOLD_BYTES) return content;

    const compressed = gzipSync(Buffer.from(content, "utf-8"));
    return COMPRESSION_MARKER + compressed.toString("base64");
}

/** Decompresses `content` if it carries the compression marker; otherwise returns it unchanged. */
export function maybeDecompress(content: string): string {
    if (!isCompressedPayload(content)) return content;

    const compressed = Buffer.from(content.slice(COMPRESSION_MARKER.length), "base64");
    return gunzipSync(compressed).toString("utf-8");
}
