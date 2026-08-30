import { ExtensionContext, ProgressLocation, window, workspace } from "vscode";
import getClipboards from "../utils/getClipboardList";
import deleteClipboard from "../utils/deleteClipboard";
import showConfigMessage from "../utils/showConfigMessage";
import promptQuickPick from "../utils/promptQuickPick";
import withSlowNotice from "../utils/withSlowNotice";
import { getActiveNamespace } from "../utils/activeNamespace";
import { reconcilePinned, removePinned } from "../utils/pinnedClipboards";
import { buildClipboardPickItems, makePinToggleHandler } from "../utils/clipboardPickItems";

export default async function del(context: ExtensionContext) {
    try{
        const config = workspace.getConfiguration("cloudclipboard");
        const namespace = getActiveNamespace(context);

        if(!namespace){
            showConfigMessage("Cloud Clipboard namespace is not configured. Please configure it in the extension settings.", "info", "namespace");
            return;
        }

        await window.withProgress({
            location: ProgressLocation.Notification,
            title: "Delete",
            cancellable: true
        }, async (progress, token) => {
            progress.report({ message: "Getting Clipboards..." });
            const connectionList = await withSlowNotice(
                getClipboards(config, namespace, context),
                () => progress.report({ message: "Still waking up the server... this can take up to 30s on the first request." })
            );

            if(connectionList === undefined){
                showConfigMessage("Cloud Clipboard is not configured correctly. Please configure it in the extension settings.");
                return;
            }

            if(connectionList.data.length === 0){
                window.showWarningMessage(`Delete: Clipboard is empty for the namespace ${namespace}.`);
                return;
            }

            if(connectionList.stale){
                window.showWarningMessage("Delete: This list is from cache (server unreachable) — it may not reflect what's actually stored. Deleting is not recommended until the connection is restored.");
            }
            if(!connectionList.stale) reconcilePinned(context, namespace, connectionList.data.map(s => s.name)); // fire-and-forget

            progress.report({ message: "Select Clipboards" });
            const selected = await promptQuickPick({
                items: buildClipboardPickItems(context, namespace, connectionList.data),
                title: connectionList.stale ? "Select Clipboards (cached — offline)" : "Select Clipboards",
                canSelectMany: true,
                ignoreFocusOut: config.get<boolean>("persistInputBox", true),
                matchOnDescription: true,
                sortByLabel: false,
                token,
                onDidTriggerItemButton: makePinToggleHandler(context, namespace, connectionList.data)
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
                deleteClipboard(config, namespace, selected),
                () => progress.report({ message: "Still deleting... this can take a moment on a cold server." })
            );

            if(status === 200){
                window.showInformationMessage(`Delete: ${selected.length} ${selected.length > 1 ? "items" : "item"} Successfully`);
                await removePinned(context, namespace, selected);
                return;
            }

            window.showWarningMessage("Delete: Error");
        });
    }catch(error){
        console.error(error);
        window.showErrorMessage("An error occurred. Error ID: DELETE");
    }
}
