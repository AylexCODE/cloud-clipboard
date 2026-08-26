import { ExtensionContext, ProgressLocation, TextEditor, Uri, window, workspace } from "vscode";
import { ClipboardData } from "../types";
import saveClipboardContent from "../utils/saveClipboardContent";
import getFiles from "../utils/getFiles";
import isSecureEndpoint from "../utils/isSecureEndpoint";
import showConfigMessage from "../utils/showConfigMessage";
import withSlowNotice from "../utils/withSlowNotice";

export default async function copy(dirs: Uri[] | undefined, context: ExtensionContext){
    try{
        const config = workspace.getConfiguration("cloudclipboard");

        if(config.get<string>("endpoint")!.trim().length === 0 || config.get<string>("namespace")!.trim().length === 0) {
            return showConfigMessage("Cloud Clipboard is not configured correctly. Please configure it in the extension settings.");
        }

        if(!isSecureEndpoint(config.get<string>("endpoint")!)) {
            return showConfigMessage("Cloud Clipboard: API Endpoint must use HTTPS (or be localhost). Please update it in settings.", "error");
        }

        const editor = window.activeTextEditor;
        if(!editor && dirs === undefined) return window.showErrorMessage("No active editor found.");

        if(dirs === undefined && editor && editor.document.getText(editor.selection).trim().length === 0){
            return window.showWarningMessage("Please highlight content to save.");
        }

        const clipboard = await window.showInputBox({
            prompt: "Create clipboard",
            title: "Copy As",
            placeHolder: "My Clipboard",
            ignoreFocusOut: config.get<boolean>("persistInputBox", true),
            validateInput: input => {
                return input.trim().length <= 64 ? input.trim().length === 0 ? "Clipboard name cannot be empty" : null : "Clipboard name cannot be greater than 64"
            }
        });

        if(!clipboard){
            return window.showWarningMessage("Copy: Cancelled");
        }

        window.withProgress({
            location: ProgressLocation.Notification,
            title: "Copy",
            cancellable: true
        }, async (progress, token) => {
            progress.report({ message: `To "${clipboard}"` });

            const { contents, totalBytes } = dirs === undefined
                ? collectEditorSelection(editor!)
                : await collectDirectoryContents(dirs);

            if(contents === undefined) return; // error already shown by collectDirectoryContents

            const saveStatus = await withSlowNotice(
                saveClipboardContent(config, clipboard, contents, token),
                () => progress.report({ message: "Still uploading... this can take a moment on a cold server." })
            );
            if(saveStatus?.status === 404 && saveStatus.text === "Not Found") {
                showConfigMessage("Cloud Clipboard is not configured correctly. Please configure it in the extension settings.");
                return;
            }

            copyStatus(saveStatus?.status, saveStatus?.text, totalBytes, clipboard);
        });
    }catch(error){
        console.error(error);
        window.showErrorMessage("An error occurred. Error ID: COPY");
    }
}

/** Builds the single-item clipboard payload from the active editor's selection. */
function collectEditorSelection(editor: TextEditor): { contents: ClipboardData[], totalBytes: number } {
    const content = editor.document.getText(editor.selection);
    return {
        contents: [{ path: "-", content }],
        totalBytes: Buffer.byteLength(content, 'utf-8')
    };
}

/** Reads every file under the selected files/folders, relativized to their common ancestor. */
async function collectDirectoryContents(dirs: Uri[]): Promise<{ contents: ClipboardData[] | undefined, totalBytes: number }> {
    const contents: ClipboardData[] = [];
    let totalBytes = 0;

    const splitPaths = dirs.map(p => workspace.asRelativePath(p.path).split('/'));
    const minLength = Math.min(...splitPaths.map(p => p.length));
    let commonCount = 0;

    for(let i = 0; i < minLength - 1; i++){
        const segment = splitPaths[0][i];
        const isCommon = splitPaths.every(p => p[i] === segment);
        if(!isCommon) break;
        commonCount++;
    }

    for(const dir of dirs){
        const files = await getFiles(dir);

        for(const file of files.files){
            try{
                totalBytes += (await workspace.fs.stat(file)).size;

                const fileContent = Buffer.from(await workspace.fs.readFile(file)).toString('utf-8');
                contents.push({
                    path: workspace.asRelativePath(file.path).split('/').slice(commonCount).join('/'),
                    content: fileContent
                });
            }catch(error){
                console.error(error);
                window.showErrorMessage(`Copy: "${workspace.asRelativePath(file)}" Failed`);
                return { contents: undefined, totalBytes };
            }
        }
    }

    return { contents, totalBytes };
}

function copyStatus(status: number | undefined, text: string | undefined, totalBytes: number, clipboard: string){
    if(status === 200){
        window.showInformationMessage(`Copy: "${clipboard}" Successfully`);
    }else if(status === 413){
        window.showErrorMessage(`Copy: Total selected files are too big, your selection is ${(totalBytes / 1048576).toFixed(2)} MiB. (This limit depends on the specific API endpoint being used)`);
    }else if(status === 0 && text === "AbortError"){
        window.showErrorMessage("Copy: Cancelled");
    }else{
        window.showErrorMessage("An error occurred while copying to cloud clipboard.");
    }
}
