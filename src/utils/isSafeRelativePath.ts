export default function isSafeRelativePath(input: string): boolean {
    if (!input || input.trim().length === 0) return false;

    const normalized = input.replace(/\\/g, "/").trim();

    if (normalized.startsWith("/")) return false;
    if (/^[a-zA-Z]:/.test(normalized)) return false;

    const segments = normalized.split("/");
    return !segments.some(seg => seg === "..");
}
