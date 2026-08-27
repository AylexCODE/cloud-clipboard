import { ExtensionContext, StatusBarAlignment, window, workspace } from "vscode";

/**
 * Creates a status bar item showing the configured namespace (or a
 * "Not Configured" prompt), with the endpoint in the tooltip. Clicking it
 * opens Cloud Clipboard settings. Refreshes whenever the configuration
 * changes.
 */
export default function createStatusBarItem(context: ExtensionContext) {
    const item = window.createStatusBarItem(StatusBarAlignment.Right, 100);
    item.command = {
        command: "workbench.action.openSettings",
        arguments: ["@ext:AylexCODE.cloud-clipboard"],
        title: "Open Cloud Clipboard Settings"
    };

    function refresh() {
        const config = workspace.getConfiguration("cloudclipboard");
        const namespace = config.get<string>("namespace")!.trim();
        const endpoint = config.get<string>("endpoint")!.trim();

        if(!namespace || !endpoint){
            item.text = "$(cloud) Cloud Clipboard: Not Configured";
            item.tooltip = "Click to configure Cloud Clipboard";
            item.show();
            return;
        }

        item.text = `$(cloud) ${namespace}`;
        item.tooltip = `Cloud Clipboard\nNamespace: ${namespace}\nEndpoint: ${endpoint}`;
        item.show();
    }

    refresh();
    context.subscriptions.push(workspace.onDidChangeConfiguration(event => {
        if(event.affectsConfiguration("cloudclipboard")) refresh();
    }));
    context.subscriptions.push(item);
}
