import { commands, window, workspace } from "vscode";
import getClipboards from "../utils/getClipboardList";
import deleteClipboard from "../utils/deleteClipboard";

export default async function del() {    
    try{
        const config = workspace.getConfiguration("cloudclipboard");

        const connectionList = await getClipboards(config);
        if(connectionList === undefined){
            return window.showWarningMessage("Cloud Clipboard is not configured correctly. Please configure it in the extension settings.", "Open Settings").then(selection => {
                if (selection === "Open Settings") {
                    commands.executeCommand("workbench.action.openSettings", "@ext:AylexCODE.cloud-clipboard");
                }
            });
        }

        const items = connectionList.map((conn) => {
            return { label: conn };
        });

        if(items.length === 0) return window.showWarningMessage(`Clipboard is empty for the namespace ${config.get<string>("namespace")!}`);

        const clipboardList = await window.showQuickPick(items, {
            canPickMany: true,
            title: "Select Clipboard Identifier",
            ignoreFocusOut: config.get<boolean>("persistInputBox", true)
        });

        if(clipboardList && clipboardList?.length > 0){
            const confirmDelete = await window.showWarningMessage(`Are you sure you want to delete${clipboardList.map(l => ' '+l.label)}?`, { modal: true }, "Yes", "No");

            if(confirmDelete === "No" || confirmDelete === undefined) return window.showInformationMessage("Delete cancelled.");
            if(confirmDelete === "Yes" || config.get<boolean>("confirmDelete", true) === false){
                const clipboard = await deleteClipboard(config, clipboardList.map(l => l.label));
                if(clipboard === 200) return window.showInformationMessage(`Deleted${clipboardList.map(l => ' '+l.label)} successfully`);
            }
            window.showWarningMessage("Delete error.");
        }else{
            window.showInformationMessage("Delete cancelled.");
        }
    }catch{
        window.showErrorMessage("An error occured. Error ID: DELETE");
    }
}