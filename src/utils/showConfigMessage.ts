import { commands, window } from "vscode";

type Level = "info" | "warning" | "error";

/**
 * Shows a message (info/warning/error) with an "Open Settings" action that
 * jumps straight to the Cloud Clipboard settings page. Used for every
 * "not configured" / "endpoint must use HTTPS" style message so the copy
 * and behavior stay consistent across copy/paste/delete.
 */
export default function showConfigMessage(message: string, level: Level = "info") {
    const show = level === "error" ? window.showErrorMessage
        : level === "warning" ? window.showWarningMessage
        : window.showInformationMessage;

    return show(message, "Open Settings").then(selection => {
        if(selection === "Open Settings") {
            commands.executeCommand("workbench.action.openSettings", "@ext:AylexCODE.cloud-clipboard");
        }
    });
}
