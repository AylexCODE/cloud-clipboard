import { CancellationToken, ExtensionContext, ProgressLocation, Uri, window, workspace, WorkspaceConfiguration } from "vscode";
import path = require("path");

import getClipboards from "../utils/getClipboardList";
import getClipboardContent from "../utils/getClipboardContent";
import isSafeRelativePath from "../utils/isSafeRelativePath";
import showConfigMessage from "../utils/showConfigMessage";
import promptQuickPick from "../utils/promptQuickPick";
import promptInputBox from "../utils/promptInputBox";
import withSlowNotice from "../utils/withSlowNotice";
import formatClipboardSummary from "../utils/formatClipboardSummary";
import confirmPaste from "../utils/confirmPaste";
import getNonCollidingPath from "../utils/getNonCollidingPath";
import { ClipboardData } from "../types";

export default async function paste(dir: string | undefined, _context: ExtensionContext) {
    try{
        const config = workspace.getConfiguration("cloudclipboard");

        await window.withProgress({
            location: ProgressLocation.Notification,
            title: "Paste",
            cancellable: true
        }, async (progress, token) => {
            progress.report({ message: "Getting Clipboards..." });
            const connectionList = await withSlowNotice(
                getClipboards(config),
                () => progress.report({ message: "Still waking up the server... this can take up to 30s on the first request." })
            );

            if(connectionList === undefined){
                showConfigMessage("Cloud Clipboard is not configured correctly. Please configure it in the extension settings.");
                return;
            }
            if(connectionList.length === 0){
                window.showWarningMessage(`Paste: Clipboard is empty for the namespace ${config.get<string>("namespace")!}.`);
                return;
            }

            progress.report({ message: "Select Clipboard" });
            const selected = await promptQuickPick({
                items: connectionList.map(summary => ({ label: summary.name, description: formatClipboardSummary(summary) })),
                title: "Select Clipboard",
                ignoreFocusOut: config.get<boolean>("persistInputBox", true),
                token
            });
            if(!selected || selected.length === 0){
                window.showWarningMessage("Paste: Cancelled");
                return;
            }
            const clipboardName = selected[0];

            progress.report({ message: `Getting Clipboard From "${clipboardName}"` });
            const fetched = await withSlowNotice(
                getClipboardContent(config, clipboardName),
                () => progress.report({ message: "Still fetching... this can take a moment on a cold server." })
            );
            if(!fetched){
                window.showWarningMessage("Paste: Error");
                return;
            }
            if(fetched.length === 0){
                window.showWarningMessage("Paste: Cancelled, clipboard is empty.");
                return;
            }

            const clipboard: ClipboardData[] = fetched;

            if(config.get<boolean>("confirmPaste", true)){
                const confirmed = await confirmPaste(clipboardName, clipboard);
                if(!confirmed){
                    window.showWarningMessage("Paste: Cancelled");
                    return;
                }
            }

            if(dir === undefined){
                await pasteToEditor(config, clipboardName, clipboard, token);
            }else{
                await pasteToExplorer(config, dir, clipboardName, clipboard, token);
            }
        });
    }catch(error){
        console.error(error);
        window.showErrorMessage("An error occurred. Error ID: PASTE");
    }
}

/** Pastes as text into the active editor's selection, or into a new folder tree if the clipboard holds multiple files. */
async function pasteToEditor(config: WorkspaceConfiguration, clipboardName: string, clipboard: ClipboardData[], token: CancellationToken) {
    const editor = window.activeTextEditor;
    if(!editor){
        window.showErrorMessage("No active editor found.");
        return;
    }

    if(clipboard.length === 1){
        const selection = editor.selection;
        const pasted = await editor.edit(editBuilder => {
            editBuilder.replace(selection, clipboard[0].content);
        });

        if(!pasted){
            window.showWarningMessage("Paste: Error");
            return;
        }
        window.showInformationMessage(`Paste: "${clipboardName}" At Line ${selection.active.line + 1}`);
        return;
    }

    const saveDir = workspace.getWorkspaceFolder(editor.document.uri);
    if(!saveDir){
        window.showWarningMessage("Paste: Error");
        return;
    }

    const getDefault = workspace.asRelativePath(editor.document.uri).split("/"); getDefault.pop();
    const defaultPath = `${getDefault.join("/")}/`;

    const folderName = await promptInputBox({
        prompt: "Enter save path",
        title: "Save To Folder",
        placeholder: "My Folder",
        value: defaultPath,
        valueSelection: [defaultPath.length, defaultPath.length],
        ignoreFocusOut: config.get<boolean>("persistInputBox", true),
        validate: value => isSafeRelativePath(value) ? undefined : 'Path must be relative and cannot contain ".."',
        token
    });

    if(folderName === undefined){
        window.showWarningMessage("Paste: Cancelled");
        return;
    }

    await vscodeClipboard(saveDir.uri.path, folderName, clipboard, clipboardName, config.get<boolean>("forcePaste", false));
}

/** Pastes into the given Explorer-selected directory: a single named file, or a new folder tree for multiple files. */
async function pasteToExplorer(config: WorkspaceConfiguration, dir: string, clipboardName: string, clipboard: ClipboardData[], token: CancellationToken) {
    const persistInputBox = config.get<boolean>("persistInputBox", true);

    if(clipboard.length === 1){
        const fileName = await promptInputBox({
            prompt: "Create file name",
            title: "Save As File",
            placeholder: "File.js",
            ignoreFocusOut: persistInputBox,
            validate: value => value.trim().length === 0
                ? "File name cannot be empty"
                : !isSafeRelativePath(value) ? 'File name must be relative and cannot contain ".."' : undefined,
            token
        });

        if(fileName === undefined){
            window.showWarningMessage("Paste: Cancelled");
            return;
        }

        const filePath = Uri.file(path.join(dir, fileName));
        await workspace.fs.writeFile(filePath, Buffer.from(clipboard[0].content, "utf-8"));

        window.showInformationMessage(`Paste: "${clipboardName}" at "${fileName}"`);
        const createdFile = await workspace.openTextDocument(filePath);
        await window.showTextDocument(createdFile);
        return;
    }

    const folderName = await promptInputBox({
        prompt: "Enter save path",
        title: "Save To Folder",
        placeholder: "My Folder",
        ignoreFocusOut: persistInputBox,
        validate: value => isSafeRelativePath(value) ? undefined : 'Path must be relative and cannot contain ".."',
        token
    });

    if(folderName === undefined){
        window.showWarningMessage("Paste: Cancelled");
        return;
    }

    await vscodeClipboard(dir, folderName, clipboard, clipboardName, config.get<boolean>("forcePaste", false));
}

async function vscodeClipboard(saveDir: string, folderName: string, clipboardContents: ClipboardData[], clipboard: string, forcePaste: boolean) {
    try{
        const savePath = Uri.joinPath(Uri.file(saveDir), folderName);
        await workspace.fs.createDirectory(savePath);

        const safeContents = clipboardContents.filter(data => isSafeRelativePath(data.path) || data.path === "-");
        const skipped = clipboardContents.length - safeContents.length;
        if(skipped > 0){
            window.showWarningMessage(`Paste: Skipped ${skipped} item${skipped > 1 ? "s" : ""} with an unsafe file path.`);
        }

        let isSaved = false;
        await Promise.all(safeContents.map(async (data) => {
            const filePath = Uri.joinPath(Uri.file(saveDir), folderName, data.path);

            try{
                await workspace.fs.stat(filePath);

                if(forcePaste){
                    save(filePath, data);
                    isSaved = true;
                }else{
                    const choice = await window.showWarningMessage(
                        `A file named "${filePath.path.split('/').pop()}" already exists.`,
                        { modal: true }, "Overwrite", "Keep Both", "Skip"
                    );

                    if(choice === "Overwrite"){
                        save(filePath, data);
                        isSaved = true;
                    }else if(choice === "Keep Both"){
                        const renamedPath = await getNonCollidingPath(filePath);
                        save(renamedPath, data);
                        isSaved = true;
                    }
                    // "Skip" or dismissed: leave the existing file untouched.
                }
            }catch{
                save(filePath, data);
                isSaved = true;
            }
        }));

        isSaved ? window.showInformationMessage(`Pasted "${clipboard}" at "${savePath.path.split("/").pop() === workspace.name ? savePath.path.split("/").pop() : workspace.asRelativePath(savePath).split("\\").pop()}"`) : window.showWarningMessage("Paste: Cancelled");
    }catch(error){
        console.error(error);
        window.showErrorMessage("Couldn't find the information you requested. It may have been moved or deleted. Error ID: PASTE_MULTI");
    }
}

async function save(filePath: Uri, data: {content: string}){
    await workspace.fs.writeFile(filePath, Buffer.from(data.content, "utf-8"));
    const createdFile = await workspace.openTextDocument(filePath);
    await window.showTextDocument(createdFile);
}
