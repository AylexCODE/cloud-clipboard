import { window } from "vscode";
import { ClipboardData } from "../types";

const PREVIEW_CHARS = 300;
const MAX_LISTED_FILES = 10;

/**
 * Shows the user what's about to be pasted (a text snippet for a single
 * text clipboard, or a file listing for a multi-file clipboard) and asks
 * for confirmation. Returns false if the user cancels.
 */
export default async function confirmPaste(clipboardName: string, clipboard: ClipboardData[]): Promise<boolean> {
    if(clipboard.length === 1 && clipboard[0].path === "-"){
        const content = clipboard[0].content;
        const preview = content.length > PREVIEW_CHARS ? content.slice(0, PREVIEW_CHARS) + "…" : content;

        const choice = await window.showInformationMessage(
            `Paste "${clipboardName}"?\n\n${preview}`,
            { modal: true }, "Paste"
        );
        return choice === "Paste";
    }

    const listed = clipboard.slice(0, MAX_LISTED_FILES).map(c => c.path).join("\n");
    const more = clipboard.length > MAX_LISTED_FILES ? `\n…and ${clipboard.length - MAX_LISTED_FILES} more` : "";
    const title = clipboard.length > 1 ? `Paste "${clipboardName}" (${clipboard.length} files)?` : `Paste "${clipboardName}"?`;

    const choice = await window.showInformationMessage(
        `${title}\n\n${listed}${more}`,
        { modal: true }, "Paste"
    );
    return choice === "Paste";
}
