import { window, WorkspaceConfiguration } from "vscode";

export default async function getClipboards(config: WorkspaceConfiguration): Promise<string[] | undefined> {
    const endpoint: string = config.get<string>("endpoint")!;
    const clipboardNamespace: string = config.get<string>("namespace")!;

    if(endpoint.trim().length === 0 || clipboardNamespace.trim().length === 0) return undefined;
    
    try{
        const connections = await fetch(`${endpoint}/list?namespace=${clipboardNamespace}&sort=${config.get<string>("sortResults")!}`);
        if(connections.statusText == "Not Found" && connections.status == 404) return undefined;
        return await connections.json() as string[];
    }catch{
        window.showErrorMessage("An error occurred. Error ID: GET_CLIPBOARDS");
        return [];
    }
}