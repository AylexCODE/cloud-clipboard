import { EventEmitter, ExtensionContext, workspace } from "vscode";

const STATE_KEY = "cloudclipboard.activeNamespace";
const changeEmitter = new EventEmitter<void>();

/** Fires whenever setActiveNamespace writes a new value, so UI (status bar) can refresh without polling. */
export const onDidChangeActiveNamespace = changeEmitter.event;

export type NamespaceScope = "workspace" | "global";

/**
 * The active namespace lives in extension storage (workspaceState /
 * globalState) rather than settings.json, so it doesn't show up in the
 * Settings UI — switching only happens through the "Switch Namespace
 * Profile" command / status bar item.
 *
 * Workspace state is checked first so different projects can sit on
 * different active namespaces; global state is the fallback for
 * single-file/no-workspace usage.
 */
export function getActiveNamespace(context: ExtensionContext): string {
    const workspaceValue = context.workspaceState.get<string>(STATE_KEY);
    if(workspaceValue !== undefined) return workspaceValue;

    return context.globalState.get<string>(STATE_KEY) ?? "";
}

export async function setActiveNamespace(context: ExtensionContext, namespace: string, scope: NamespaceScope): Promise<void> {
    await (scope === "workspace"
        ? context.workspaceState.update(STATE_KEY, namespace)
        : context.globalState.update(STATE_KEY, namespace));
    changeEmitter.fire();
}

/** Workspace scope when a workspace/folder is open (so projects can differ), global otherwise. */
export function defaultNamespaceScope(): NamespaceScope {
    return (workspace.workspaceFolders?.length ?? 0) > 0 ? "workspace" : "global";
}
