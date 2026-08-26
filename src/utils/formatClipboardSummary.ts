import { ClipboardSummary } from "../types";
import formatBytes from "./formatBytes";
import formatRelativeTime from "./formatRelativeTime";

export default function formatClipboardSummary(summary: ClipboardSummary): string | undefined {
    const parts: string[] = [];

    if(summary.fileCount !== undefined) parts.push(`${summary.fileCount} file${summary.fileCount === 1 ? "" : "s"}`);
    if(summary.size !== undefined) parts.push(formatBytes(summary.size));

    const relative = summary.updatedAt ? formatRelativeTime(summary.updatedAt) : undefined;
    if(relative) parts.push(relative);

    return parts.length > 0 ? parts.join(" · ") : undefined;
}
