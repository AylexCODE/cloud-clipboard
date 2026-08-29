import { Disposable, ExtensionContext, window, workspace } from "vscode";
import { getActiveNamespace, getActiveNamespaceProfile, getActiveNamespaceScope, setActiveNamespace, clearActiveNamespace } from "./activeNamespace";

/**
 * Keeps the active namespace in sync with its source cloudclipboard.namespaceProfiles
 * entry when that entry is edited directly in settings.json (rather than through
 * the "Switch Namespace Profile" picker):
 *
 * - Entry's value changed (key still exists) -> active namespace is auto-updated
 *   to match, staying linked to that profile. A blank/whitespace-only new value
 *   counts as removal (see below), not "switch to an empty namespace".
 * - Entry deleted entirely (key no longer exists) -> active namespace is unset,
 *   status bar falls back to "Not Configured".
 *
 * Only reacts to the specific entry the active namespace came from — other
 * profiles being added/edited doesn't touch it, and a namespace typed manually
 * (no source profile) is never touched here at all.
 */
export default function watchNamespaceProfiles(context: ExtensionContext): Disposable {
    return workspace.onDidChangeConfiguration(event => {
        if(!event.affectsConfiguration("cloudclipboard.namespaceProfiles")) return;

        const sourceProfile = getActiveNamespaceProfile(context);
        if(!sourceProfile) return; // typed manually, or already unset — nothing to reconcile

        const profiles = workspace.getConfiguration("cloudclipboard").get<Record<string, string>>("namespaceProfiles", {});
        const currentNamespace = getActiveNamespace(context);
        const newValue = profiles[sourceProfile];

        if(newValue === currentNamespace) return; // entry still there and unchanged, nothing to do

        if(newValue === undefined || newValue.trim().length === 0){
            // Entry deleted, or repointed to blank — both mean unset.
            clearActiveNamespace(context);
            window.showInformationMessage(`Cloud Clipboard: Namespace unset (profile "${sourceProfile}" was removed)`);
            return;
        }

        // Entry still exists with a new non-blank value — follow it, keeping the link.
        const scope = getActiveNamespaceScope(context);
        setActiveNamespace(context, newValue, scope, sourceProfile);
        window.showInformationMessage(`Cloud Clipboard: Namespace updated to "${newValue}" (profile "${sourceProfile}" changed)`);
    });
}
