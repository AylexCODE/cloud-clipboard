import { commands, ExtensionContext, window, WorkspaceConfiguration } from "vscode";

const DEFAULT_ENDPOINT = "https://cloud-clipboard-api.onrender.com";
const ACKNOWLEDGED_KEY = "cloudclipboard.defaultEndpointAcknowledged";

export default function warnIfDefaultEndpoint(context: ExtensionContext, config: WorkspaceConfiguration) {
    const endpoint = config.get<string>("endpoint")!.trim();
    if(endpoint !== DEFAULT_ENDPOINT) return;
    if(context.globalState.get<boolean>(ACKNOWLEDGED_KEY)) return;

    context.globalState.update(ACKNOWLEDGED_KEY, true);

    window.showInformationMessage(
        "Cloud Clipboard is using the default shared API endpoint. Your copied content passes through a third-party server (cloud-clipboard-api.onrender.com). For full privacy, you can configure your own endpoint in settings.",
        "Open Settings",
        "Dismiss"
    ).then(selection => {
        if(selection === "Open Settings") {
            commands.executeCommand("workbench.action.openSettings", "@ext:AylexCODE.cloud-clipboard");
        }
    });
}
