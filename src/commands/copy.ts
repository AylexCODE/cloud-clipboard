import { ExtensionContext, Progress, ProgressLocation, TextEditor, Uri, window, workspace } from "vscode";
import { ClipboardData } from "../types";
import saveClipboardContent from "../utils/saveClipboardContent";
import getFiles from "../utils/getFiles";
import isSecureEndpoint from "../utils/isSecureEndpoint";
import showConfigMessage from "../utils/showConfigMessage";
import withSlowNotice from "../utils/withSlowNotice";
import isBinaryFile from "../utils/isBinaryFile";
import { maybeCompress } from "../utils/compression";
import { getActiveNamespace } from "../utils/activeNamespace";
import { DEFAULT_ENDPOINT, DEFAULT_ENDPOINT_MAX_UPLOAD_BYTES } from "../utils/defaultEndpoint";

const MAX_LISTED_SKIPPED_FILES = 10;

export default async function copy(dirs: Uri[] | undefined, context: ExtensionContext){
    try{
        const config = workspace.getConfiguration("cloudclipboard");
        const namespace = getActiveNamespace(context);

        if(!namespace){
            showConfigMessage("Cloud Clipboard namespace is not configured. Please configure it in the extension settings.", "info", "namespace");
            return;
        }

        if(config.get<string>("endpoint")!.trim().length === 0 || namespace.trim().length === 0) {
            return showConfigMessage("Cloud Clipboard is not configured correctly. Please configure it in the extension settings.");
        }

        if(!isSecureEndpoint(config.get<string>("endpoint")!)) {
            return showConfigMessage("Cloud Clipboard: API Endpoint must use HTTPS (or be localhost). Please update it in settings.", "error");
        }

        const editor = window.activeTextEditor;
        if(!editor && dirs === undefined){
            window.showErrorMessage("No active editor found.");
            return;
        }

        if(dirs === undefined && editor && editor.document.getText(editor.selection).trim().length === 0){
            window.showWarningMessage("Please highlight content to save.");
            return;
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
            window.showWarningMessage("Copy: Cancelled");
            return;
        }

        window.withProgress({
            location: ProgressLocation.Notification,
            title: "Copy",
            cancellable: true
        }, async (progress, token) => {
            progress.report({ message: `To "${clipboard}"` });

            const { contents, totalBytes, skippedBinary } = dirs === undefined
                ? collectEditorSelection(editor!)
                : await collectDirectoryContents(dirs, progress);

            if(contents === undefined) return; // error already shown by collectDirectoryContents

            if(skippedBinary.length > 0){
                const listed = skippedBinary.slice(0, MAX_LISTED_SKIPPED_FILES).join(", ");
                const more = skippedBinary.length > MAX_LISTED_SKIPPED_FILES ? `, and ${skippedBinary.length - MAX_LISTED_SKIPPED_FILES} more` : "";
                window.showWarningMessage(`Copy: Skipped ${skippedBinary.length} image/binary file${skippedBinary.length > 1 ? "s" : ""} not supported by Cloud Clipboard: ${listed}${more}`);
            }

            if(contents.length === 0){
                window.showWarningMessage("Copy: Nothing to copy — every selected file was an image/binary file, which Cloud Clipboard doesn't support.");
                return;
            }

            // The 1 MiB cap is documented for the default shared endpoint only (see README);
            // a self-hosted endpoint may allow more, so this check is skipped for those —
            // the 413 handler below still catches an oversized upload in that case.
            if(config.get<string>("endpoint")!.trim() === DEFAULT_ENDPOINT && totalBytes > DEFAULT_ENDPOINT_MAX_UPLOAD_BYTES){
                window.showErrorMessage(`Copy: Your selection is ${(totalBytes / 1048576).toFixed(2)} MiB, which exceeds the default API endpoint's ${(DEFAULT_ENDPOINT_MAX_UPLOAD_BYTES / 1048576).toFixed(0)} MiB limit. Configure your own endpoint in settings to remove this limit.`);
                return;
            }

            progress.report({ message: `Uploading "${clipboard}"...` });

            const saveStatus = await withSlowNotice(
                saveClipboardContent(config, namespace, clipboard, contents, token),
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
function collectEditorSelection(editor: TextEditor): { contents: ClipboardData[], totalBytes: number, skippedBinary: string[] } {
    const content = maybeCompress(editor.document.getText(editor.selection));
    return {
        contents: [{ path: "-", content }],
        totalBytes: Buffer.byteLength(content, 'utf-8'),
        skippedBinary: []
    };
}

/**
 * Reads every file under the selected files/folders, relativized to their
 * common ancestor. Binary files (images, archives, etc.) are skipped —
 * Cloud Clipboard has no binary storage support and reading them as UTF-8
 * text would silently corrupt them — and returned separately so the caller
 * can tell the user what got left out. Large text content is compressed
 * before being added, so `totalBytes` reflects what's actually uploaded.
 */
async function collectDirectoryContents(dirs: Uri[], progress: Progress<{ message?: string, increment?: number }>): Promise<{ contents: ClipboardData[] | undefined, totalBytes: number, skippedBinary: string[] }> {
    const contents: ClipboardData[] = [];
    const skippedBinary: string[] = [];
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

    const fileLists = await Promise.all(dirs.map(dir => getFiles(dir)));
    const allFiles = fileLists.flatMap(f => f.files);
    // Increment is a percentage (0-100) VS Code accumulates across calls; splitting it
    // evenly per file gives real feedback on larger folders instead of one indeterminate spin.
    const incrementPerFile = allFiles.length > 0 ? 100 / allFiles.length : 0;

    for(const file of allFiles){
        try{
            const relativePath = workspace.asRelativePath(file.path).split('/').slice(commonCount).join('/');
            progress.report({ message: `Reading ${relativePath}`, increment: incrementPerFile });

            const rawBytes = await workspace.fs.readFile(file);

            if(isBinaryFile(relativePath, rawBytes)){
                skippedBinary.push(relativePath);
                continue;
            }

            const content = maybeCompress(Buffer.from(rawBytes).toString('utf-8'));
            totalBytes += Buffer.byteLength(content, 'utf-8');
            contents.push({ path: relativePath, content });
        }catch(error){
            console.error(error);
            window.showErrorMessage(`Copy: "${workspace.asRelativePath(file)}" Failed`);
            return { contents: undefined, totalBytes, skippedBinary };
        }
    }

    return { contents, totalBytes, skippedBinary };
}

function copyStatus(status: number | undefined, text: string | undefined, totalBytes: number, clipboard: string){
    if(status === 200){
        window.showInformationMessage(`Copy: "${clipboard}" Successfully`);
    }else if(status === 413){
        window.showErrorMessage(`Copy: Total selected files are too big, your selection is ${(totalBytes / 1048576).toFixed(2)} MiB. (This limit depends on the specific API endpoint being used)`);
    }else if(status === 0 && text === "AbortError"){
        window.showErrorMessage("Copy: Cancelled");
    }else if(status === 0 && text === "Timeout"){
        window.showErrorMessage("Copy: Timed out waiting for the server. Check your connection or endpoint setting.");
    }else if(status === 0 && text === "NetworkError"){
        window.showErrorMessage("Copy: Could not reach the server. Check your connection or endpoint setting.");
    }else{
        window.showErrorMessage("An error occurred while copying to cloud clipboard.");
    }
}
