import { ExtensionContext, window, WorkspaceConfiguration } from "vscode";
import { CacheAwareResult, ClipboardData } from "../types";
import isSecureEndpoint from "./isSecureEndpoint";
import apiFetch, { ApiFetchError } from "./apiFetch";
import describeApiFetchError from "./describeApiFetchError";
import { maybeDecompress } from "./compression";
import { getCachedContent, setCachedContent } from "./clipboardCache";
import formatRelativeTime from "./formatRelativeTime";

export default async function getClipboardContent(config: WorkspaceConfiguration, namespace: string, clipboard: string, context: ExtensionContext): Promise<CacheAwareResult<ClipboardData[]> | undefined> {
    const endpoint: string = config.get<string>("endpoint")!;
    const clipboardNamespace: string = namespace;

    if(endpoint.trim().length === 0 || clipboardNamespace.trim().length === 0) return undefined;
    if(!isSecureEndpoint(endpoint)) {
        window.showErrorMessage("Cloud Clipboard: API Endpoint must use HTTPS (or be localhost). Please update it in settings.");
        return undefined;
    }

    try{
        const response = await apiFetch(`${endpoint}/content?namespace=${clipboardNamespace}&clipboard=${clipboard}`);
        const raw = await response.json() as ClipboardData[];
        // Decompression happens at this single boundary so everything downstream
        // (confirmPaste preview, pasteToEditor, pasteToExplorer) can treat content
        // as plain text without knowing compression exists.
        const data = raw.map(item => ({ path: item.path, content: maybeDecompress(item.content) }));
        setCachedContent(context, clipboardNamespace, clipboard, data); // fire-and-forget
        return { data, stale: false };
    }catch(error){
        console.error(error);

        if(error instanceof ApiFetchError && error.kind === "aborted"){
            const { message } = describeApiFetchError(error, "Paste");
            window.showErrorMessage(message);
            return undefined;
        }

        const cached = getCachedContent(context, clipboardNamespace, clipboard);
        if(cached){
            const age = formatRelativeTime(cached.fetchedAt) ?? "a while ago";
            window.showWarningMessage(`Paste: Server unreachable. Pasting cached content for "${clipboard}" from ${age} — it may be out of date.`);
            return { data: cached.data, stale: true, fetchedAt: cached.fetchedAt };
        }

        const { message } = describeApiFetchError(error, "Paste");
        window.showErrorMessage(message);
        return undefined;
    }
}

