import { ExtensionContext } from "vscode";
import { ClipboardData, ClipboardSummary } from "../types";

const CACHE_KEY = "cloudclipboard.cache";

/** How many namespaces' worth of cache to keep before evicting the least-recently-touched. */
const MAX_NAMESPACES = 8;
/** How many clipboards' content to keep cached per namespace before evicting the oldest. */
const MAX_CLIPBOARDS_PER_NAMESPACE = 25;

export interface CachedList {
    data: ClipboardSummary[];
    /** ISO date string — reusable directly with formatRelativeTime(). */
    fetchedAt: string;
}

export interface CachedContent {
    data: ClipboardData[];
    fetchedAt: string;
}

interface NamespaceCache {
    list?: CachedList;
    content: Record<string, CachedContent>;
    /** ISO date string of the last read or write, for LRU eviction across namespaces. */
    touchedAt: string;
}

type CacheStore = Record<string, NamespaceCache>;

/**
 * The cache lives in globalState (not workspace state) because a namespace
 * isn't tied to any one workspace — you might paste the same namespace's
 * content from several projects or machines syncing the same profile.
 *
 * This is a best-effort local mirror for read-only fallback, not a source
 * of truth: it's never used to satisfy a request that could otherwise
 * reach the live server, only when a fetch has already failed.
 */
function readStore(context: ExtensionContext): CacheStore {
    return context.globalState.get<CacheStore>(CACHE_KEY, {});
}

async function writeStore(context: ExtensionContext, store: CacheStore): Promise<void> {
    await context.globalState.update(CACHE_KEY, store);
}

function touchNamespace(store: CacheStore, namespace: string): NamespaceCache {
    const existing = store[namespace];
    const entry: NamespaceCache = existing ?? { content: {}, touchedAt: new Date().toISOString() };
    entry.touchedAt = new Date().toISOString();
    store[namespace] = entry;
    evictNamespacesIfNeeded(store);
    return entry;
}

/** Drops the least-recently-touched namespace(s) once the cache holds more than MAX_NAMESPACES. */
function evictNamespacesIfNeeded(store: CacheStore): void {
    const names = Object.keys(store);
    if(names.length <= MAX_NAMESPACES) return;

    const oldestFirst = names.sort((a, b) => store[a].touchedAt.localeCompare(store[b].touchedAt));
    for(const name of oldestFirst.slice(0, names.length - MAX_NAMESPACES)){
        delete store[name];
    }
}

/** Drops the oldest cached clipboard content in a namespace once it holds more than MAX_CLIPBOARDS_PER_NAMESPACE. */
function evictContentIfNeeded(entry: NamespaceCache): void {
    const names = Object.keys(entry.content);
    if(names.length <= MAX_CLIPBOARDS_PER_NAMESPACE) return;

    const oldestFirst = names.sort((a, b) => entry.content[a].fetchedAt.localeCompare(entry.content[b].fetchedAt));
    for(const name of oldestFirst.slice(0, names.length - MAX_CLIPBOARDS_PER_NAMESPACE)){
        delete entry.content[name];
    }
}

export function getCachedList(context: ExtensionContext, namespace: string): CachedList | undefined {
    return readStore(context)[namespace]?.list;
}

export async function setCachedList(context: ExtensionContext, namespace: string, data: ClipboardSummary[]): Promise<void> {
    const store = readStore(context);
    const entry = touchNamespace(store, namespace);
    entry.list = { data, fetchedAt: new Date().toISOString() };
    await writeStore(context, store);
}

export function getCachedContent(context: ExtensionContext, namespace: string, clipboard: string): CachedContent | undefined {
    return readStore(context)[namespace]?.content[clipboard];
}

export async function setCachedContent(context: ExtensionContext, namespace: string, clipboard: string, data: ClipboardData[]): Promise<void> {
    const store = readStore(context);
    const entry = touchNamespace(store, namespace);
    entry.content[clipboard] = { data, fetchedAt: new Date().toISOString() };
    evictContentIfNeeded(entry);
    await writeStore(context, store);
}
