import { window, WorkspaceConfiguration } from "vscode";
import isSecureEndpoint from "./isSecureEndpoint";
import apiFetch from "./apiFetch";
import describeApiFetchError from "./describeApiFetchError";

export default async function deleteClipboard(config: WorkspaceConfiguration, namespace: string, clipboards: string[]): Promise<number | undefined> {
    const endpoint: string = config.get<string>("endpoint")!;
    const clipboardNamespace: string = namespace;

    if(endpoint.trim().length === 0 || clipboardNamespace.trim().length === 0) return undefined;
    if(!isSecureEndpoint(endpoint)) {
        window.showErrorMessage("Cloud Clipboard: API Endpoint must use HTTPS (or be localhost). Please update it in settings.");
        return undefined;
    }

    try{
        const deleteStatus = await apiFetch(`${endpoint}?namespace=${clipboardNamespace}`, {
            method: "DELETE",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(clipboards)
        });
        return deleteStatus.status;
    }catch(error){
        console.error(error);
        const { message } = describeApiFetchError(error, "Delete");
        window.showErrorMessage(message);
        return 400;
    }
}
