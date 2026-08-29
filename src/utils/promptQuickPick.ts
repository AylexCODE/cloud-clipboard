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
    /**
     * Called when the user clicks a per-item button (e.g. a pin toggle).
     * Return the full replacement item list to refresh the picker in place —
     * the picker stays open and nothing resolves.
     */
    onDidTriggerItemButton?: (item: QuickPickPromptItem) => (string | QuickPickPromptItem)[] | Promise<(string | QuickPickPromptItem)[]>;
}

function toVscodeItems(items: (string | QuickPickPromptItem)[]) {
    return items.map(item => {
        if(typeof item === "string") return { label: item };
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
        quickPick.items = toVscodeItems(options.items);
        quickPick.title = options.title;
        quickPick.canSelectMany = options.canSelectMany ?? false;
        quickPick.ignoreFocusOut = options.ignoreFocusOut ?? true;

        let accepted = false;

        const cancelListener = options.token?.onCancellationRequested(() => {
            quickPick.dispose();
        });

        const buttonListener = options.onDidTriggerItemButton && quickPick.onDidTriggerItemButton(async (event: QuickPickItemButtonEvent<any>) => {
            const clicked: QuickPickPromptItem = { label: event.item.label, description: event.item.description, detail: event.item.detail, value: event.item.value };
            const updated = await options.onDidTriggerItemButton!(clicked);
            quickPick.items = toVscodeItems(updated);
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
            quickPick.dispose();
            if(!accepted) resolve(undefined);
        });

        quickPick.show();
    });
}
