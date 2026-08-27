/**
 * Returns true if `input` is safe to join onto a base directory: no empty
 * value, no absolute path (POSIX or Windows drive letter), and no ".."
 * traversal segments. Used to validate both user-entered folder/file names
 * and file paths coming back from the (potentially untrusted/shared) API.
 */
export default function isSafeRelativePath(input: string): boolean {
    if (!input || input.trim().length === 0) return false;

    const normalized = input.replace(/\\/g, "/").trim();

    if (normalized.startsWith("/")) return false;
    if (/^[a-zA-Z]:/.test(normalized)) return false;

    const segments = normalized.split("/");
    return !segments.some(seg => seg === "..");
}
