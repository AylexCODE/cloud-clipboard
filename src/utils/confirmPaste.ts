import { window } from "vscode";
import { ClipboardData } from "../types";

const PREVIEW_CHARS = 300;
const MAX_LISTED_FILES = 10;

export default async function confirmPaste(clipboardName: string, clipboardLength: number): Promise<boolean> {
    if(clipboardLength === 1){
        const choice = await window.showInformationMessage(
            `Paste "${clipboardName}"?`,
            { modal: true }, "Paste"
        );
        return choice === "Paste";
    }

    const choice = await window.showInformationMessage(
        `Paste "${clipboardName}" (${clipboardLength} files)?`,
        { modal: true }, "Paste"
    );
    return choice === "Paste";
}
