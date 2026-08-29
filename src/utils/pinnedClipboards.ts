import { ExtensionContext } from "vscode";

const PINNED_KEY = "cloudclipboard.pinnedClipboards";

/** namespace -> pinned clipboard names */
type PinnedStore = Record<string, string[]>;

/**
 * Pinning is purely a client-side convenience — the Cloud Clipboard API has
 * no concept of it, so it's never sent to the server and won't show up for
 * anyone else pasting into the same namespace from a different machine.
 * Stored in globalState (not workspace state) so it follows the namespace
 * regardless of which project you're pinning from.
 */
function readStore(context: ExtensionContext): PinnedStore {
    return context.globalState.get<PinnedStore>(PINNED_KEY, {});
}

async function writeStore(context: ExtensionContext, store: PinnedStore): Promise<void> {
    await context.globalState.update(PINNED_KEY, store);
}

export function getPinned(context: ExtensionContext, namespace: string): string[] {
    return readStore(context)[namespace] ?? [];
}

export function isPinned(context: ExtensionContext, namespace: string, clipboard: string): boolean {
    return getPinned(context, namespace).includes(clipboard);
}

/** Flips the pinned state of a clipboard and returns the new state. */
export async function togglePinned(context: ExtensionContext, namespace: string, clipboard: string): Promise<boolean> {
    const store = readStore(context);
    const list = store[namespace] ?? [];
    const index = list.indexOf(clipboard);

    const nowPinned = index === -1;
    store[namespace] = nowPinned ? [...list, clipboard] : list.filter(name => name !== clipboard);

    await writeStore(context, store);
    return nowPinned;
}

/** Removes specific clipboards from the pinned set immediately, e.g. right after a successful delete — no need to wait for the next reconcilePinned(). */
export async function removePinned(context: ExtensionContext, namespace: string, clipboards: string[]): Promise<void> {
    const store = readStore(context);
    const list = store[namespace];
    if(!list || list.length === 0) return;

    const removeSet = new Set(clipboards);
    const filtered = list.filter(name => !removeSet.has(name));
    if(filtered.length === list.length) return;

    store[namespace] = filtered;
    await writeStore(context, store);
}

/**
 * Drops pinned names that no longer appear in a fresh (non-cached) clipboard
 * list, so deleting a pinned clipboard — or it expiring server-side — doesn't
 * leave a permanent ghost entry in the pinned set. Safe to call after every
 * successful list fetch; a no-op when nothing needs to change.
 */
export async function reconcilePinned(context: ExtensionContext, namespace: string, currentNames: string[]): Promise<void> {
    const store = readStore(context);
    const list = store[namespace];
    if(!list || list.length === 0) return;

    const currentSet = new Set(currentNames);
    const filtered = list.filter(name => currentSet.has(name));
    if(filtered.length === list.length) return;

    store[namespace] = filtered;
    await writeStore(context, store);
}

/**
 * Stable-partitions items into pinned-first, unpinned-after, preserving the
 * original (already sort-order-configured) relative order within each group.
 */
export function sortWithPinned<T extends { name: string }>(items: T[], pinned: string[]): T[] {
    const pinnedSet = new Set(pinned);
    return [...items].sort((a, b) => Number(!pinnedSet.has(a.name)) - Number(!pinnedSet.has(b.name)));
}
