import { window, WorkspaceConfiguration } from "vscode";
import { ClipboardData } from "../types";
import isSecureEndpoint from "./isSecureEndpoint";
import apiFetch from "./apiFetch";
import describeApiFetchError from "./describeApiFetchError";
import { maybeDecompress } from "./compression";

export default async function getClipboardContent(config: WorkspaceConfiguration, clipboard: string): Promise<ClipboardData[] | undefined> {
    const endpoint: string = config.get<string>("endpoint")!;
    const clipboardNamespace: string = config.get<string>("namespace")!;

    if(endpoint.trim().length === 0 || clipboardNamespace.trim().length === 0) return undefined;
    if(!isSecureEndpoint(endpoint)) {
        window.showErrorMessage("Cloud Clipboard: API Endpoint must use HTTPS (or be localhost). Please update it in settings.");
        return undefined;
    }

    try{
        const data = await apiFetch(`${endpoint}/content?namespace=${clipboardNamespace}&clipboard=${clipboard}`);
        const raw = await data.json() as ClipboardData[];
        // Decompression happens at this single boundary so everything downstream
        // (confirmPaste preview, pasteToEditor, pasteToExplorer) can treat content
        // as plain text without knowing compression exists.
        return raw.map(item => ({ path: item.path, content: maybeDecompress(item.content) }));
    }catch(error){
        console.error(error);
        const { message } = describeApiFetchError(error, "Paste");
        window.showErrorMessage(message);
        return [];
    }
}

