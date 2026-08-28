import { window, WorkspaceConfiguration } from "vscode";
import isSecureEndpoint from "./isSecureEndpoint";
import { ClipboardSummary } from "../types";
import apiFetch from "./apiFetch";
import describeApiFetchError from "./describeApiFetchError";

export default async function getClipboards(config: WorkspaceConfiguration, namespace: string): Promise<ClipboardSummary[] | undefined> {
    const endpoint: string = config.get<string>("endpoint")!;
    const clipboardNamespace: string = namespace;

    if(endpoint.trim().length === 0 || clipboardNamespace.trim().length === 0) return undefined;
    if(!isSecureEndpoint(endpoint)) {
        window.showErrorMessage("Cloud Clipboard: API Endpoint must use HTTPS (or be localhost). Please update it in settings.");
        return undefined;
    }

    try{
        const connections = await apiFetch(`${endpoint}/list?namespace=${clipboardNamespace}&sort=${config.get<string>("sortResults")!}`);
        if(connections.statusText === "Not Found" && connections.status === 404) return undefined;
        return normalizeClipboardList(await connections.json());
    }catch(error){
        console.error(error);
        const { message } = describeApiFetchError(error, "Paste");
        window.showErrorMessage(message);
        return [];
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
