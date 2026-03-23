import { WorkspaceConfiguration } from "vscode";
import { ClipboardData } from "../types";

export default async function saveClipboardContent(config: WorkspaceConfiguration, clipboard: string, content: ClipboardData[]): Promise<number | undefined> {
    const endpoint: string = config.get<string>("endpoint")!;
    const clipboardNamespace: string = config.get<string>("namespace")!;

    if(endpoint.trim().length === 0 || clipboardNamespace.trim().length === 0) return undefined;
    const clipboardRes = await fetch(`${endpoint}?namespace=${clipboardNamespace}&clipboard=${clipboard}`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify(content)
    });

    return clipboardRes.status;
}