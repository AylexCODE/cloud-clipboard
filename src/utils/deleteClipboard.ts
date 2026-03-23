import { WorkspaceConfiguration } from "vscode";

export default async function deleteClipboard(config: WorkspaceConfiguration, clipboard: string): Promise<number | undefined> {
    const endpoint: string = config.get<string>("endpoint")!;
    const clipboardNamespace: string = config.get<string>("namespace")!;
    
    if(endpoint.trim().length === 0 || clipboardNamespace.trim().length === 0) return undefined;

    try{
        const data = await fetch(`${endpoint}?namespace=${clipboardNamespace}&clipboard=${clipboard}`, {method: "delete"});
        return data.status;
    }catch{
        return 400;
    }
}