import { WorkspaceConfiguration } from "vscode";

export default async function deleteClipboard(config: WorkspaceConfiguration, clipboard: string): Promise<number | undefined> {
    const endpoint: string = config.get<string>("endpoint")!;
    const connection: string = config.get<string>("connection")!;
    
    if(endpoint.trim().length === 0 || connection.trim().length === 0) return undefined;

    try{
        const data = await fetch(`${endpoint}?connection=${connection}&clipboard=${clipboard}`, {method: "delete"});
        return data.status;
    }catch{
        return 400;
    }
}