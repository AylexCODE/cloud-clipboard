import { window, WorkspaceConfiguration } from "vscode";
import isSecureEndpoint from "./isSecureEndpoint";

export default async function deleteClipboard(config: WorkspaceConfiguration, clipboards: string[]): Promise<number | undefined> {
    const endpoint: string = config.get<string>("endpoint")!;
    const clipboardNamespace: string = config.get<string>("namespace")!;
    
    if(endpoint.trim().length === 0 || clipboardNamespace.trim().length === 0) return undefined;
    if(!isSecureEndpoint(endpoint)) {
        window.showErrorMessage("Cloud Clipboard: API Endpoint must use HTTPS (or be localhost). Please update it in settings.");
        return undefined;
    }

    try{
        const deleteStatus = await fetch(`${endpoint}?namespace=${clipboardNamespace}`, {
            method: "DELETE",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(clipboards)
        });
        return deleteStatus.status;
    }catch(error){
        console.error(error);
        window.showErrorMessage("An error occurred. Error ID: DELETE_CLIPBOARD");
        return 400;
    }
}