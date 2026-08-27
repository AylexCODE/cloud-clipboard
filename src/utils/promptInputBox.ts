import { CancellationToken, window } from "vscode";

export interface InputBoxPromptOptions {
    prompt: string;
    title: string;
    placeholder?: string;
    value?: string;
    valueSelection?: [number, number];
    ignoreFocusOut?: boolean;
    validate?: (value: string) => string | undefined;
    token?: CancellationToken;
}

/**
 * Shows an InputBox and resolves with the entered value, or undefined if
 * the user cancels. If `validate` is provided, it's used both for live
 * validation messages and to block acceptance (Enter) while the current
 * value is invalid. Wraps the create/show/onDidAccept/onDidHide/dispose
 * boilerplate that was previously repeated for every file/folder name prompt.
 */
export default function promptInputBox(options: InputBoxPromptOptions): Promise<string | undefined> {
    return new Promise<string | undefined>((resolve) => {
        const box = window.createInputBox();
        box.prompt = options.prompt;
        box.title = options.title;
        if(options.placeholder !== undefined) box.placeholder = options.placeholder;
        if(options.value !== undefined) box.value = options.value;
        if(options.valueSelection !== undefined) box.valueSelection = options.valueSelection;
        box.ignoreFocusOut = options.ignoreFocusOut ?? true;

        if(options.validate){
            box.validationMessage = options.validate(box.value);
            box.onDidChangeValue(value => {
                box.validationMessage = options.validate!(value);
            });
        }

        let accepted = false;

        const cancelListener = options.token?.onCancellationRequested(() => {
            box.dispose();
        });

        box.onDidAccept(() => {
            if(options.validate && options.validate(box.value)) return;
            accepted = true;
            const value = box.value;
            box.dispose();
            resolve(value);
        });

        box.onDidHide(() => {
            cancelListener?.dispose();
            box.dispose();
            if(!accepted) resolve(undefined);
        });

        box.show();
    });
}
