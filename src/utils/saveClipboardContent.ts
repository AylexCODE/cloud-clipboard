import { CancellationToken, window, WorkspaceConfiguration } from "vscode";
import { ClipboardData } from "../types";
import isSecureEndpoint from "./isSecureEndpoint";
import apiFetch, { ApiFetchError } from "./apiFetch";

export default async function saveClipboardContent(config: WorkspaceConfiguration, namespace: string, clipboard: string, content: ClipboardData[], token: CancellationToken): Promise<{ status: number, text: string } | undefined> {
    const endpoint: string = config.get<string>("endpoint")!;
    const clipboardNamespace: string = namespace;

    if(endpoint.trim().length === 0 || clipboardNamespace.trim().length === 0) return undefined;
    if(!isSecureEndpoint(endpoint)) {
        window.showErrorMessage("Cloud Clipboard: API Endpoint must use HTTPS (or be localhost). Please update it in settings.");
        return undefined;
    }

    // Bridge VS Code's CancellationToken to a standard AbortSignal so apiFetch
    // (which knows nothing about vscode) can cancel the in-flight request/retries.
    const controller = new AbortController();
    token.onCancellationRequested(() => controller.abort());

    try{
        const clipboardRes = await apiFetch(`${endpoint}?namespace=${clipboardNamespace}&clipboard=${clipboard}`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(content),
            externalSignal: controller.signal
        });

        return {status: clipboardRes.status, text: clipboardRes.statusText};
    }catch(error){
        if(error instanceof ApiFetchError){
            if(error.kind === "aborted") return {status: 0, text: "AbortError"};
            if(error.kind === "timeout") return {status: 0, text: "Timeout"};
            return {status: 0, text: "NetworkError"};
        }
        console.error(error);
        window.showErrorMessage("An error occurred. Error ID: SAVE_CLIPBOARD");
        return {status: 400, text: "Unknown"};
    }
}
