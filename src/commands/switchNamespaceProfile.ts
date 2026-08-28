import { commands, ExtensionContext, QuickPickItem, window, workspace } from "vscode";
import promptInputBox from "../utils/promptInputBox";
import { getActiveNamespace, setActiveNamespace, defaultNamespaceScope } from "../utils/activeNamespace";

interface ProfileQuickPickItem extends QuickPickItem {
    /** The namespace to switch to, or undefined for the "manage/type" escape-hatch items. */
    namespace?: string;
    action?: "manage" | "typeCustom";
}

/**
 * Shows a quick-pick of the namespaces configured under
 * `cloudclipboard.namespaceProfiles` and switches to whichever one is
 * picked. The active namespace lives in extension storage (see
 * activeNamespace.ts), not settings.json — written to workspace state when
 * a workspace/folder is open (so different projects can remember different
 * active profiles), falling back to global state otherwise (e.g.
 * single-file mode, where there's no workspace to scope a write to).
 */
export default async function switchNamespaceProfile(context: ExtensionContext) {
    const config = workspace.getConfiguration("cloudclipboard");
    const profiles = config.get<Record<string, string>>("namespaceProfiles", {});
    const currentNamespace = getActiveNamespace(context);
    const profileNames = Object.keys(profiles);

    const items: ProfileQuickPickItem[] = profileNames.map(name => ({
        label: `${profiles[name] === currentNamespace ? "$(check) " : "$(cloud) "}${name}`,
        description: profiles[name],
        namespace: profiles[name]
    }));

    items.push(
        { label: "$(edit) Type a Namespace…", action: "typeCustom" },
        { label: "$(gear) Manage Profiles…", action: "manage" }
    );

    const picked = await window.showQuickPick(items, {
        title: "Switch Cloud Clipboard Namespace",
        placeHolder: currentNamespace ? `Current: ${currentNamespace}` : "No namespace configured yet",
        matchOnDescription: true
    });

    if(!picked) return;

    if(picked.action === "manage"){
        commands.executeCommand("workbench.action.openSettings", "cloudclipboard.namespaceProfiles");
        return;
    }

    let targetNamespace = picked.namespace;

    if(picked.action === "typeCustom"){
        targetNamespace = await promptInputBox({
            prompt: "Enter namespace",
            title: "Switch Namespace",
            placeholder: "my.namespace",
            value: currentNamespace,
            ignoreFocusOut: config.get<boolean>("persistInputBox", true)
        });
        if(!targetNamespace) return;
    }

    if(!targetNamespace || targetNamespace === currentNamespace) return;

    await setActiveNamespace(context, targetNamespace, defaultNamespaceScope());

    window.showInformationMessage(`Cloud Clipboard: Switched to "${targetNamespace}"`);
}
