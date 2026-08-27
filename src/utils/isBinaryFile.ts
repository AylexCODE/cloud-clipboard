/**
 * Classifies a file as binary (image, archive, etc.) so copy can skip it
 * instead of corrupting it as UTF-8 text (Cloud Clipboard has no binary
 * storage support). Extension is checked first since it's cheap and covers
 * the common cases; content is only sniffed as a fallback for extensions
 * this doesn't recognize.
 */

const BINARY_EXTENSIONS = new Set([
    // images
    "png", "jpg", "jpeg", "gif", "bmp", "webp", "ico", "tiff", "tif", "psd", "heic", "avif",
    // archives
    "zip", "gz", "tgz", "tar", "rar", "7z", "bz2", "xz", "zst",
    // documents (binary/zip-based formats)
    "pdf", "docx", "xlsx", "pptx", "odt", "ods", "odp",
    // audio/video
    "mp3", "wav", "ogg", "flac", "m4a", "aac", "mp4", "mov", "avi", "mkv", "webm", "flv", "wmv",
    // executables / installers
    "exe", "dll", "so", "dylib", "bin", "dmg", "msi", "app", "deb", "rpm",
    // fonts
    "ttf", "otf", "woff", "woff2", "eot",
    // compiled / misc binary
    "class", "pyc", "o", "obj", "a", "lib", "wasm", "sqlite", "sqlite3", "db", "jar", "war", "iso"
]);

const TEXT_EXTENSIONS = new Set([
    "ts", "tsx", "js", "jsx", "mjs", "cjs", "json", "jsonc", "md", "markdown", "txt", "py", "rb",
    "go", "rs", "java", "kt", "c", "cpp", "cc", "h", "hpp", "cs", "php", "html", "htm", "css", "scss",
    "less", "yml", "yaml", "xml", "svg", "sh", "bash", "zsh", "ps1", "sql", "toml", "ini", "cfg",
    "conf", "env", "graphql", "vue", "svelte", "lua", "swift", "r", "pl", "gitignore", "gitattributes",
    "editorconfig", "dockerfile", "makefile", "log", "csv", "tsv"
]);

/** Bytes to inspect when sniffing content of a file with an unrecognized extension. */
const SNIFF_SAMPLE_SIZE = 8000;

function getExtension(fileName: string): string {
    const lastDot = fileName.lastIndexOf(".");
    const lastSlash = Math.max(fileName.lastIndexOf("/"), fileName.lastIndexOf("\\"));
    if (lastDot <= lastSlash) return ""; // no extension, or a dotfile like ".gitignore" (handled via full-name check below)
    return fileName.slice(lastDot + 1).toLowerCase();
}

/** True if the byte sample looks like binary content: a null byte, or a high ratio of non-printable/control bytes. */
function looksBinary(bytes: Uint8Array): boolean {
    const sample = bytes.subarray(0, Math.min(bytes.length, SNIFF_SAMPLE_SIZE));
    if (sample.length === 0) return false;

    let nonPrintable = 0;
    for (const byte of sample) {
        if (byte === 0) return true; // null byte: strong binary signal, short-circuit
        const isTab = byte === 9, isLF = byte === 10, isCR = byte === 13;
        if (isTab || isLF || isCR) continue;
        if (byte < 32 || byte === 127) nonPrintable++;
    }

    return nonPrintable / sample.length > 0.3;
}

/**
 * Returns true if `fileName` (with its `content` bytes) should be treated
 * as binary and skipped during copy.
 */
export default function isBinaryFile(fileName: string, content: Uint8Array): boolean {
    const baseName = fileName.split(/[/\\]/).pop() ?? fileName;
    const ext = getExtension(baseName);

    if (ext && BINARY_EXTENSIONS.has(ext)) return true;
    if (ext && TEXT_EXTENSIONS.has(ext)) return false;
    if (!ext && TEXT_EXTENSIONS.has(baseName.toLowerCase().replace(/^\./, ""))) return false; // e.g. "Dockerfile", ".gitignore"

    return looksBinary(content);
}
