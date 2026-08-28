import { ExtensionContext, StatusBarAlignment, window, workspace } from "vscode";
import { getActiveNamespace, onDidChangeActiveNamespace } from "./activeNamespace";

/**
 * Creates a status bar item showing the active namespace (or a
 * "Not Configured" prompt) — resolved to its profile name if it matches
 * one configured in `cloudclipboard.namespaceProfiles`, otherwise shown as
 * the raw namespace — with the endpoint in the tooltip. Clicking it opens
 * the namespace-switcher quick-pick. Refreshes on both settings.json
 * changes (endpoint, profiles) and active-namespace changes (which live in
 * extension storage, not settings.json, so they need their own event).
 */
export default function createStatusBarItem(context: ExtensionContext) {
    const item = window.createStatusBarItem(StatusBarAlignment.Right, 100);

    function refresh() {
        const config = workspace.getConfiguration("cloudclipboard");
        const namespace = getActiveNamespace(context).trim();
        const endpoint = config.get<string>("endpoint")!.trim();

        if(!namespace || !endpoint){
            item.text = "$(cloud) Cloud Clipboard: Not Configured";
            item.tooltip = "Click to configure Cloud Clipboard";
            item.command = {
                command: "workbench.action.openSettings",
                arguments: ["@ext:AylexCODE.cloud-clipboard"],
                title: "Open Cloud Clipboard Settings"
            };
            item.show();
            return;
        }

        const profiles = config.get<Record<string, string>>("namespaceProfiles", {});
        const activeProfileName = Object.keys(profiles).find(name => profiles[name] === namespace);
        const displayLabel = activeProfileName ?? namespace;

        item.text = `$(cloud) ${displayLabel}`;
        item.tooltip = `Cloud Clipboard\nNamespace: ${namespace}${activeProfileName ? ` (${activeProfileName})` : ""}\nEndpoint: ${endpoint}\n\nClick to switch namespace`;
        item.command = {
            command: "cloudclipboard.switchNamespaceProfile",
            title: "Switch Cloud Clipboard Namespace"
        };
        item.show();
    }

    refresh();
    context.subscriptions.push(workspace.onDidChangeConfiguration(event => {
        if(event.affectsConfiguration("cloudclipboard")) refresh();
    }));
    context.subscriptions.push(onDidChangeActiveNamespace(() => refresh()));
    context.subscriptions.push(item);
}
