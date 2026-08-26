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
