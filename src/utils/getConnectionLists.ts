import { WorkspaceConfiguration } from "vscode";

export default async function getConnections(config: WorkspaceConfiguration): Promise<string[] | undefined> {
    const endpoint: string = config.get<string>("endpoint")!;
    const connection: string = config.get<string>("connection")!;

    if(endpoint.trim().length === 0 || connection.trim().length === 0) return undefined;
    
    try{
        const connections = await fetch(`${endpoint}/list?connection=${connection}`);
        return await connections.json() as string[];
    }catch{
        return [];
    }
}