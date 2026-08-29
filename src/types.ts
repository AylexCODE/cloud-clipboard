import { Uri } from "vscode";

export interface ClipboardData {
    path: string;
    content: string;
}

export interface FilesData {
    bytes: number;
    files: Uri[];
}

export interface ClipboardSummary {
    name: string;
    size?: number;
    fileCount?: number;
    updatedAt?: string;
}

export interface CacheAwareResult<T> {
    data: T;
    /** True when this came from the local cache after a live request failed, rather than from the server. */
    stale: boolean;
    /** When the cached data was originally fetched. Only set when stale is true. */
    fetchedAt?: string;
}