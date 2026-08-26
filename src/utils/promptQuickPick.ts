import { CancellationToken, window } from "vscode";

export interface QuickPickPromptItem {
    label: string;
    description?: string;
    detail?: string;
}

export interface QuickPickPromptOptions {
    items: (string | QuickPickPromptItem)[];
    title: string;
    canSelectMany?: boolean;
    ignoreFocusOut?: boolean;
    token?: CancellationToken;
}

export default function promptQuickPick(options: QuickPickPromptOptions): Promise<string[] | undefined> {
    return new Promise<string[] | undefined>((resolve) => {
        const quickPick = window.createQuickPick();
        quickPick.items = options.items.map(item => typeof item === "string" ? { label: item } : item);
        quickPick.title = options.title;
        quickPick.canSelectMany = options.canSelectMany ?? false;
        quickPick.ignoreFocusOut = options.ignoreFocusOut ?? true;

        let accepted = false;

        const cancelListener = options.token?.onCancellationRequested(() => {
            quickPick.dispose();
        });

        quickPick.onDidAccept(() => {
            accepted = true;
            const selected = quickPick.selectedItems.map(i => i.label);
            quickPick.dispose();
            resolve(selected.length > 0 ? selected : undefined);
        });

        quickPick.onDidHide(() => {
            cancelListener?.dispose();
            quickPick.dispose();
            if(!accepted) resolve(undefined);
        });

        quickPick.show();
    });
}
