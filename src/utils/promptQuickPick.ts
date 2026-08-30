import { CancellationToken, QuickPickItemButtonEvent, ThemeIcon, window } from "vscode";

export interface QuickPickPromptButton {
    /** Codicon id, e.g. "star-full" / "star-empty" (see https://microsoft.github.io/vscode-codicons/dist/codicon.html). */
    icon: string;
    tooltip?: string;
}

export interface QuickPickPromptItem {
    label: string;
    description?: string;
    detail?: string;
    /** Resolved value when this item is picked; falls back to `label`. Use this when `label` carries display-only decoration (e.g. a pin icon) that shouldn't end up in the result. */
    value?: string;
    buttons?: readonly QuickPickPromptButton[];
}

export interface QuickPickPromptOptions {
    items: (string | QuickPickPromptItem)[];
    title: string;
    canSelectMany?: boolean;
    ignoreFocusOut?: boolean;
    token?: CancellationToken;
    /** Let the typed filter match against `description` too, not just `label`. Default false (VS Code's own default). */
    matchOnDescription?: boolean;
    /**
     * Whether VS Code should re-sort filtered results by match quality as
     * the user types. Default true (VS Code's own default) — set false to
     * preserve the given item order (e.g. pinned-first) while filtering.
     */
    sortByLabel?: boolean;
    /**
     * Called when the user clicks a per-item button (e.g. a pin toggle).
     * Return the full replacement item list to refresh the picker in place —
     * the picker stays open and nothing resolves.
     */
    onDidTriggerItemButton?: (item: QuickPickPromptItem) => (string | QuickPickPromptItem)[] | Promise<(string | QuickPickPromptItem)[]>;
}

function toVscodeItems(items: (string | QuickPickPromptItem)[]) {
    return items.map(item => {
        if(typeof item === "string") return { label: item, description: undefined as string | undefined };
        return {
            ...item,
            buttons: item.buttons?.map(b => ({ iconPath: new ThemeIcon(b.icon), tooltip: b.tooltip }))
        };
    });
}

/**
 * Shows a QuickPick and resolves with the selected label(s), or undefined
 * if the user cancels (Escape, clicking away, or the linked cancellation
 * token firing). Items can be plain strings or {label, description, detail}
 * objects for showing extra metadata (e.g. clipboard size/file count).
 * Wraps the create/show/onDidAccept/onDidHide/dispose boilerplate that was
 * previously repeated in every command.
 */
export default function promptQuickPick(options: QuickPickPromptOptions): Promise<string[] | undefined> {
    return new Promise<string[] | undefined>((resolve) => {
        const quickPick = window.createQuickPick();
        const matchOnDescription = options.matchOnDescription ?? false;
        const sortByLabel = options.sortByLabel ?? true;
        let allItems = toVscodeItems(options.items);

        quickPick.items = allItems;
        quickPick.title = options.title;
        quickPick.canSelectMany = options.canSelectMany ?? false;
        quickPick.ignoreFocusOut = options.ignoreFocusOut ?? true;

        // VS Code's stable API has no supported way to stop createQuickPick()
        // from re-sorting filtered results by match quality — the property
        // that used to do this, `sortByLabel`, only ever existed as a
        // proposed API (`quickPickSortByLabel`) and isn't part of the
        // stable QuickPick type, so setting it is a silent no-op. When the
        // caller wants the given order preserved while filtering (e.g.
        // pinned-first), filter the items ourselves on each keystroke
        // instead of leaning on VS Code's built-in filter/sort — assigning
        // an already-filtered array to `quickPick.items` shows exactly
        // that array, unreordered.
        quickPick.matchOnDescription = sortByLabel && matchOnDescription;
        const valueListener = !sortByLabel && quickPick.onDidChangeValue(value => {
            const needle = value.trim().toLowerCase();
            quickPick.items = needle.length === 0 ? allItems : allItems.filter(item =>
                item.label.toLowerCase().includes(needle) ||
                (matchOnDescription && item.description?.toLowerCase().includes(needle))
            );
        });

        let accepted = false;

        const cancelListener = options.token?.onCancellationRequested(() => {
            quickPick.dispose();
        });

        const buttonListener = options.onDidTriggerItemButton && quickPick.onDidTriggerItemButton(async (event: QuickPickItemButtonEvent<any>) => {
            const clicked: QuickPickPromptItem = { label: event.item.label, description: event.item.description, detail: event.item.detail, value: event.item.value };
            const updated = await options.onDidTriggerItemButton!(clicked);
            allItems = toVscodeItems(updated);
            quickPick.items = allItems;
        });

        quickPick.onDidAccept(() => {
            accepted = true;
            const selected = quickPick.selectedItems.map((i: any) => i.value ?? i.label);
            quickPick.dispose();
            resolve(selected.length > 0 ? selected : undefined);
        });

        quickPick.onDidHide(() => {
            cancelListener?.dispose();
            buttonListener?.dispose();
            if(valueListener) valueListener.dispose();
            quickPick.dispose();
            if(!accepted) resolve(undefined);
        });

        quickPick.show();
    });
}
