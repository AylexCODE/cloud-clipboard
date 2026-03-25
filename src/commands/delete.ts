import { commands, ProgressLocation, window, workspace } from "vscode";
import getClipboards from "../utils/getClipboardList";
import deleteClipboard from "../utils/deleteClipboard";

export default async function del() {    
    try{
        const config = workspace.getConfiguration("cloudclipboard");

        window.withProgress({
            location: ProgressLocation.Notification,
            title: "Delete",
            cancellable: true
        }, async (progress, token) => {
            let didNotAcceptQuickPick = true;

            await new Promise<void>(async (resolve) => {
                const clipboardList = window.createQuickPick();

                token.onCancellationRequested(() => {
                    window.showInformationMessage("Delete: Cancelled");
                    clipboardList.dispose();
                    resolve();
                });
                
                progress.report({ message: "Getting Clipboards..." });
                const connectionList = await getClipboards(config);
                progress.report({ message: "Select Clipboards" });
            
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

                if(items.length === 0) return window.showWarningMessage(`Delete: Clipboard is empty for the namespace ${config.get<string>("namespace")!}.`);

                clipboardList.items = items;
                clipboardList.title = "Select Clipboards";
                clipboardList.canSelectMany = true;
                clipboardList.ignoreFocusOut = config.get<boolean>("persistInputBox", true);

                clipboardList.onDidAccept(async () => {
                    didNotAcceptQuickPick = false; clipboardList.dispose();
                    const confirmDelete = await window.showWarningMessage(`Are you sure you want to delete${clipboardList.selectedItems.length > 1 ? ` these ${clipboardList.selectedItems.length} items:\n` : ':\n'}${clipboardList.selectedItems.map(l => ' '+l.label)}?`, { modal: true }, "Yes", "No");

                    if(confirmDelete === "No" || confirmDelete === undefined) return window.showInformationMessage("Delete: Cancelled");
                    if(confirmDelete === "Yes" || config.get<boolean>("confirmDelete", true) === false){
                        progress.report({ message: "Deleting clipboards..." });
                        const clipboard = await deleteClipboard(config, clipboardList.selectedItems.map(l => l.label));
                        if(clipboard === 200) return window.showInformationMessage(`Delete: ${clipboardList.selectedItems.length} ${clipboardList.selectedItems.length > 1 ? "items" : "item"} Successfully`);
                    }
                    window.showWarningMessage("Delete: Error");
                });

                clipboardList.onDidHide(() => {
                    if(didNotAcceptQuickPick) window.showInformationMessage("Delete: Cancelled");
                    clipboardList.dispose();
                    resolve();
                });

                clipboardList.show();
            });
        });
    }catch{
        window.showErrorMessage("An error occurred. Error ID: DELETE");
    }
}