import { ExtensionContext } from "vscode";
import { ClipboardSummary } from "../types";
import formatClipboardSummary from "./formatClipboardSummary";
import { QuickPickPromptItem } from "./promptQuickPick";
import { getPinned, isPinned, togglePinned, sortWithPinned } from "./pinnedClipboards";

/** Pinned clipboards sort first (preserving the configured sort order within each group) and get a filled star + a pin/unpin button. */
export function buildClipboardPickItems(context: ExtensionContext, namespace: string, list: ClipboardSummary[]): QuickPickPromptItem[] {
    const sorted = sortWithPinned(list, getPinned(context, namespace));

    return sorted.map(summary => {
        const pinned = isPinned(context, namespace, summary.name);
        return {
            label: pinned ? `$(star-full) ${summary.name}` : summary.name,
            description: formatClipboardSummary(summary),
            value: summary.name,
            buttons: [{ icon: pinned ? "star-full" : "star-empty", tooltip: pinned ? "Unpin" : "Pin" }]
        };
    });
}

/**
 * onDidTriggerItemButton handler for promptQuickPick: toggles the clicked
 * clipboard's pinned state and re-renders the item list in place (pinned
 * items float to the top immediately), no re-fetch needed since `list` is
 * the same data already fetched for this picker session.
 */
export function makePinToggleHandler(context: ExtensionContext, namespace: string, list: ClipboardSummary[]) {
    return async (item: QuickPickPromptItem) => {
        await togglePinned(context, namespace, item.value ?? item.label);
        return buildClipboardPickItems(context, namespace, list);
    };
}
