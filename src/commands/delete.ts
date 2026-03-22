import { commands, window, workspace } from "vscode";
import getConnections from "../utils/getConnectionLists";
import deleteClipboard from "../utils/deleteClipboard";

export default async function del() {    
    try{
        const config = workspace.getConfiguration("cloudclipboard");

        const connectionList = await getConnections(config);
        if(connectionList === undefined){
            window.showWarningMessage("Cloud Clipboard is not configured correctly. Please configure it in the extension settings.", "Open Settings").then(selection => {
                if (selection === "Open Settings") {
                    commands.executeCommand("workbench.action.openSettings", "@ext:AylexCODE.cloud-clipboard");
                }
            });
            return;
        }

        const items = connectionList.map((conn) => {
            return { label: conn };
        });

        if(items.length === 0) return window.showWarningMessage(`Clipboard is empty for the connection ${config.get<string>("connection")!}`);

        const clipboardList = await window.showQuickPick(items, {
            canPickMany: false,
            title: "Select Clipboard"
        });

        if(clipboardList?.label){
            const clipboard = await deleteClipboard(config, clipboardList.label);
            if(clipboard === 200) return window.showInformationMessage(`Deleted ${clipboardList.label} successfully`);
            window.showWarningMessage("Delete error.");
        }else{
            window.showWarningMessage("Delete cancelled.");
        }
    }catch{
        window.showErrorMessage("An error occured.");
    }
}