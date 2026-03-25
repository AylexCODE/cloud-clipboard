import { CancellationToken, window, WorkspaceConfiguration } from "vscode";
import { ClipboardData } from "../types";

import { setTimeout } from "timers/promises";

export default async function saveClipboardContent(config: WorkspaceConfiguration, clipboard: string, content: ClipboardData[], token: CancellationToken): Promise<{ status: number, text: string } | undefined> {
    const endpoint: string = config.get<string>("endpoint")!;
    const clipboardNamespace: string = config.get<string>("namespace")!;

    if(endpoint.trim().length === 0 || clipboardNamespace.trim().length === 0) return undefined;

    const controller = new AbortController();
    token.onCancellationRequested(() => {
        controller.abort();
    });

    try{
        const clipboardRes = await fetch(`${endpoint}?namespace=${clipboardNamespace}&clipboard=${clipboard}`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(content),
            signal: controller.signal
        });

        return {status: clipboardRes.status, text: clipboardRes.statusText};
    }catch(error: any){
        if(error.name === "AbortError"){
            return {status: 0, text: "AbortError"};
        }else{
            window.showErrorMessage("An error occurred. Error ID: SAVE_CLIPBOARD");
            return {status: 400, text: "Unknown"};
        }
    }
}