import { ProgressLocation, window, workspace } from "vscode";
import getClipboards from "../utils/getClipboardList";
import deleteClipboard from "../utils/deleteClipboard";
import showConfigMessage from "../utils/showConfigMessage";
import promptQuickPick from "../utils/promptQuickPick";
import withSlowNotice from "../utils/withSlowNotice";
import formatClipboardSummary from "../utils/formatClipboardSummary";

export default async function del() {
    try{
        const config = workspace.getConfiguration("cloudclipboard");

        await window.withProgress({
            location: ProgressLocation.Notification,
            title: "Delete",
            cancellable: true
        }, async (progress, token) => {
            progress.report({ message: "Getting Clipboards..." });
            const connectionList = await withSlowNotice(
                getClipboards(config),
                () => progress.report({ message: "Still waking up the server... this can take up to 30s on the first request." })
            );

            if(connectionList === undefined){
                showConfigMessage("Cloud Clipboard is not configured correctly. Please configure it in the extension settings.");
                return;
            }

            if(connectionList.length === 0){
                window.showWarningMessage(`Delete: Clipboard is empty for the namespace ${config.get<string>("namespace")!}.`);
                return;
            }

            progress.report({ message: "Select Clipboards" });
            const selected = await promptQuickPick({
                items: connectionList.map(summary => ({ label: summary.name, description: formatClipboardSummary(summary) })),
                title: "Select Clipboards",
                canSelectMany: true,
                ignoreFocusOut: config.get<boolean>("persistInputBox", true),
                token
            });

            if(!selected || selected.length === 0){
                window.showWarningMessage("Delete: Cancelled");
                return;
            }

            const confirmDelete = config.get<boolean>("confirmDelete", true)
                ? await window.showWarningMessage(
                    `Are you sure you want to delete${selected.length > 1 ? ` these ${selected.length} items:\n` : ':\n'}${selected.map(l => ' '+l)}?`,
                    { modal: true }, "Yes", "No"
                )
                : "Yes";

            if(confirmDelete === "No" || confirmDelete === undefined){
                window.showInformationMessage("Delete: Cancelled");
                return;
            }

            progress.report({ message: "Deleting clipboards..." });
            const status = await withSlowNotice(
                deleteClipboard(config, selected),
                () => progress.report({ message: "Still deleting... this can take a moment on a cold server." })
            );

            if(status === 200){
                window.showInformationMessage(`Delete: ${selected.length} ${selected.length > 1 ? "items" : "item"} Successfully`);
                return;
            }

            window.showWarningMessage("Delete: Error");
        });
    }catch(error){
        console.error(error);
        window.showErrorMessage("An error occurred. Error ID: DELETE");
    }
}
