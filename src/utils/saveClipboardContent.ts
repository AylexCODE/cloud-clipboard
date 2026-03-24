import { window, WorkspaceConfiguration } from "vscode";
import { ClipboardData } from "../types";

export default async function saveClipboardContent(config: WorkspaceConfiguration, clipboard: string, content: ClipboardData[]): Promise<{ status: number, text: string } | undefined> {
    const endpoint: string = config.get<string>("endpoint")!;
    const clipboardNamespace: string = config.get<string>("namespace")!;

    if(endpoint.trim().length === 0 || clipboardNamespace.trim().length === 0) return undefined;

    try{
        const clipboardRes = await fetch(`${endpoint}?namespace=${clipboardNamespace}&clipboard=${clipboard}`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(content)
        });

        return {status: clipboardRes.status, text: clipboardRes.statusText};
    }catch{
        window.showErrorMessage("An error occured. Error ID: SAVE_CLIPBOARD");
        return {status: 400, text: "Unknown"};
    }
}