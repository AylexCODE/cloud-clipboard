import { WorkspaceConfiguration } from "vscode";
import { ClipboardData } from "../types";

export default async function getClipboardContent(config: WorkspaceConfiguration, clipboard: string): Promise<ClipboardData[] | undefined> {
    const endpoint: string = config.get<string>("endpoint")!;
    const connection: string = config.get<string>("connection")!;
    
    if(endpoint.trim().length === 0 || connection.trim().length === 0) return undefined;

    try{
        const data = await fetch(`${endpoint}?connection=${connection}&clipboard=${clipboard}`);
        return await data.json() as ClipboardData[];
    }catch{
        return [];
    }
}