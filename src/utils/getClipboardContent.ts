import { window, WorkspaceConfiguration } from "vscode";
import { ClipboardData } from "../types";
import isSecureEndpoint from "./isSecureEndpoint";

export default async function getClipboardContent(config: WorkspaceConfiguration, clipboard: string): Promise<ClipboardData[] | undefined> {
    const endpoint: string = config.get<string>("endpoint")!;
    const clipboardNamespace: string = config.get<string>("namespace")!;
    
    if(endpoint.trim().length === 0 || clipboardNamespace.trim().length === 0) return undefined;
    if(!isSecureEndpoint(endpoint)) {
        window.showErrorMessage("Cloud Clipboard: API Endpoint must use HTTPS (or be localhost). Please update it in settings.");
        return undefined;
    }

    try{
        const data = await fetch(`${endpoint}/content?namespace=${clipboardNamespace}&clipboard=${clipboard}`);
        return await data.json() as ClipboardData[];
    }catch(error){
        console.error(error);
        window.showErrorMessage("An error occurred. Error ID: GET_CONTENT");
        return [];
    }
}