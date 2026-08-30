import { ExtensionContext, window, WorkspaceConfiguration } from "vscode";
import isSecureEndpoint from "./isSecureEndpoint";
import { CacheAwareResult, ClipboardSummary } from "../types";
import apiFetch, { ApiFetchError } from "./apiFetch";
import describeApiFetchError from "./describeApiFetchError";
import { getCachedList, setCachedList } from "./clipboardCache";
import formatRelativeTime from "./formatRelativeTime";

export default async function getClipboards(config: WorkspaceConfiguration, namespace: string, context: ExtensionContext): Promise<CacheAwareResult<ClipboardSummary[]> | undefined> {
    const endpoint: string = config.get<string>("endpoint")!;
    const clipboardNamespace: string = namespace;

    if(endpoint.trim().length === 0 || clipboardNamespace.trim().length === 0) return undefined;
    if(!isSecureEndpoint(endpoint)) {
        window.showErrorMessage("Cloud Clipboard: API Endpoint must use HTTPS (or be localhost). Please update it in settings.");
        return undefined;
    }

    try{
        const connections = await apiFetch(`${endpoint}/list?namespace=${encodeURIComponent(clipboardNamespace)}&sort=${encodeURIComponent(config.get<string>("sortResults")!)}`);
        if(connections.statusText === "Not Found" && connections.status === 404) return undefined;

        const list = normalizeClipboardList(await connections.json());
        setCachedList(context, clipboardNamespace, list); // fire-and-forget: never block a successful fetch on a cache write
        return { data: list, stale: false };
    }catch(error){
        console.error(error);

        // A user-initiated cancel isn't "offline" — don't fall back to cache, just report it.
        if(error instanceof ApiFetchError && error.kind === "aborted"){
            const { message } = describeApiFetchError(error, "Paste");
            window.showErrorMessage(message);
            return undefined;
        }

        const cached = getCachedList(context, clipboardNamespace);
        if(cached){
            const age = formatRelativeTime(cached.fetchedAt) ?? "a while ago";
            window.showWarningMessage(`Paste: Server unreachable. Showing cached results from ${age} — this list may be out of date.`);
            return { data: cached.data, stale: true, fetchedAt: cached.fetchedAt };
        }

        const { message } = describeApiFetchError(error, "Paste");
        window.showErrorMessage(message);
        return undefined;
    }
}

/**
 * Parses the /list response into ClipboardSummary[]: an array of objects
 * { name: string, size?: number, fileCount?: number, updatedAt?: string }.
 * Entries missing a usable `name` are dropped defensively rather than
 * thrown on.
 */
function normalizeClipboardList(raw: unknown): ClipboardSummary[] {
    if(!Array.isArray(raw)) return [];

    return raw
        .filter((entry): entry is Record<string, unknown> =>
            typeof entry === "object" && entry !== null &&
            typeof (entry as Record<string, unknown>).name === "string" &&
            (entry as Record<string, unknown>).name !== "")
        .map((entry): ClipboardSummary => ({
            name: entry.name as string,
            size: typeof entry.size === "number" ? entry.size : undefined,
            fileCount: typeof entry.fileCount === "number" ? entry.fileCount : undefined,
            updatedAt: typeof entry.updatedAt === "string" ? entry.updatedAt : undefined
        }));
}
