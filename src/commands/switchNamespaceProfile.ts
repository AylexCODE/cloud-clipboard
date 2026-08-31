import { commands, ExtensionContext, QuickPickItem, window, workspace } from "vscode";
import promptInputBox from "../utils/promptInputBox";
import { getActiveNamespace, setActiveNamespace, clearActiveNamespace, defaultNamespaceScope } from "../utils/activeNamespace";

interface ProfileQuickPickItem extends QuickPickItem {
    /** The namespace to switch to, or undefined for the "manage/type" escape-hatch items. */
    namespace?: string;
    /** Name of the namespaceProfiles entry this item came from (undefined for "type a namespace"). */
    profileName?: string;
    action?: "manage" | "typeCustom";
}

export default async function switchNamespaceProfile(context: ExtensionContext) {
    const config = workspace.getConfiguration("cloudclipboard");
    const profiles = config.get<Record<string, string>>("namespaceProfiles", {});
    const currentNamespace = getActiveNamespace(context);
    const profileNames = Object.keys(profiles);

    const items: ProfileQuickPickItem[] = profileNames.map(name => ({
        label: `${profiles[name] === currentNamespace ? "$(check) " : "$(cloud) "}${name}`,
        description: profiles[name],
        namespace: profiles[name],
        profileName: name
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
    let targetProfileName = picked.profileName;

    if(picked.action === "typeCustom"){
        targetNamespace = await promptInputBox({
            prompt: "Enter namespace (leave blank to unset)",
            title: "Switch Namespace",
            placeholder: "my.namespace",
            value: currentNamespace,
            ignoreFocusOut: config.get<boolean>("persistInputBox", true)
        });
        if(targetNamespace === undefined) return; // cancelled, e.g. Esc
        targetProfileName = undefined;
    }

    if(targetNamespace !== undefined && targetNamespace.trim().length === 0){
        if(currentNamespace){
            await clearActiveNamespace(context);
            window.showInformationMessage("Cloud Clipboard: Namespace unset");
        }
        return;
    }

    if(!targetNamespace || targetNamespace.trim() === currentNamespace.trim()) return;

    targetNamespace = targetNamespace.trim();
    await setActiveNamespace(context, targetNamespace, defaultNamespaceScope(), targetProfileName);

    window.showInformationMessage(`Cloud Clipboard: Switched to "${targetNamespace}"`);
}
