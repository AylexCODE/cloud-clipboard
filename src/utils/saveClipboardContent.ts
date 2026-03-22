import { WorkspaceConfiguration } from "vscode";
import { ClipboardData } from "../types";

export default async function saveClipboardContent(config: WorkspaceConfiguration, clipboard: string, content: ClipboardData[]): Promise<number | undefined> {
    const endpoint: string = config.get<string>("endpoint")!;
    const connection: string = config.get<string>("connection")!;

    if(endpoint.trim().length === 0 || connection.trim().length === 0) return undefined;
    const clipboardRes = await fetch(`${endpoint}?connection=${connection}&clipboard=${clipboard}`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify(content)
    });

    return clipboardRes.status;
}