import { commands, window } from "vscode";

type Level = "info" | "warning" | "error";

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
