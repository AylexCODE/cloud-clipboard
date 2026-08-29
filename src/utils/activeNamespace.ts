import { EventEmitter, ExtensionContext, workspace } from "vscode";

const STATE_KEY = "cloudclipboard.activeNamespace";
/** Name of the namespaceProfiles entry the active namespace was picked from, if any (undefined when typed manually). */
const PROFILE_STATE_KEY = "cloudclipboard.activeNamespaceProfile";
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

/**
 * The namespaceProfiles entry (by name) the active namespace was set from,
 * or undefined if it was typed manually / cleared. Mirrors getActiveNamespace's
 * workspace-then-global lookup so the two stay in sync per scope.
 */
export function getActiveNamespaceProfile(context: ExtensionContext): string | undefined {
    const workspaceValue = context.workspaceState.get<string>(PROFILE_STATE_KEY);
    if(workspaceValue !== undefined) return workspaceValue;

    return context.globalState.get<string>(PROFILE_STATE_KEY);
}

/**
 * @param profileName Name of the namespaceProfiles entry this value came from,
 * if picked from the list. Omit (or pass undefined) for a typed/custom value —
 * this is what lets the profile-removal watcher tell manually-typed namespaces
 * apart from ones sourced from a profile.
 */
export async function setActiveNamespace(context: ExtensionContext, namespace: string, scope: NamespaceScope, profileName?: string): Promise<void> {
    const state = scope === "workspace" ? context.workspaceState : context.globalState;
    await state.update(STATE_KEY, namespace);
    await state.update(PROFILE_STATE_KEY, profileName);
    changeEmitter.fire();
}

/**
 * Fully clears the active namespace (and its source-profile link) in both
 * workspace and global state, regardless of which scope it was written to.
 * Used for "unset" — as opposed to setActiveNamespace(context, "", scope),
 * which only touches one scope and is meant for switching to a real value.
 */
export async function clearActiveNamespace(context: ExtensionContext): Promise<void> {
    await context.workspaceState.update(STATE_KEY, undefined);
    await context.workspaceState.update(PROFILE_STATE_KEY, undefined);
    await context.globalState.update(STATE_KEY, undefined);
    await context.globalState.update(PROFILE_STATE_KEY, undefined);
    changeEmitter.fire();
}

/** Workspace scope when a workspace/folder is open (so projects can differ), global otherwise. */
export function defaultNamespaceScope(): NamespaceScope {
    return (workspace.workspaceFolders?.length ?? 0) > 0 ? "workspace" : "global";
}

/**
 * Which scope the active namespace is actually stored in right now (mirrors
 * getActiveNamespace's workspace-then-global lookup). Used when rewriting an
 * existing value in place — e.g. auto-updating it after its source profile's
 * value changes — as opposed to defaultNamespaceScope(), which is for
 * writing a brand-new selection.
 */
export function getActiveNamespaceScope(context: ExtensionContext): NamespaceScope {
    return context.workspaceState.get<string>(STATE_KEY) !== undefined ? "workspace" : "global";
}
