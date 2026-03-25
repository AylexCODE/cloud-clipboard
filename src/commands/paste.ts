import { commands, ProgressLocation, Uri, window, workspace } from "vscode";
import path = require("path");

import getClipboards from "../utils/getClipboardList";
import getClipboardContent from "../utils/getClipboardContent";
import { ClipboardData } from "../types";

export default async function paste(dir: string | undefined) {    
    try{
        const config = workspace.getConfiguration("cloudclipboard");

        window.withProgress({
            location: ProgressLocation.Notification,
            title: "Paste",
            cancellable: true
        }, async (progress, token) => {
            await new Promise<void>(async (resolve) => {
                progress.report({ message: "Getting Clipboards..." });
                const connectionList = await getClipboards(config);
                progress.report({ message: "Select Clipboard" });
                if(connectionList === undefined){
                    return window.showInformationMessage("Cloud Clipboard is not configured correctly. Please configure it in the extension settings.", "Open Settings").then(selection => {
                        if (selection === "Open Settings") {
                            commands.executeCommand("workbench.action.openSettings", "@ext:AylexCODE.cloud-clipboard");
                        }
                    });
                }
                const persistInputBox = config.get<boolean>("persistInputBox", true);

                const clipboardList = window.createQuickPick();
                const fileName = window.createInputBox();
                const folderName = window.createInputBox();

                token.onCancellationRequested(() => {
                    window.showInformationMessage("Paste: Cancelled");
                    clipboardList.dispose();
                    fileName.dispose();
                    folderName.dispose();
                    resolve();
                });

                const items = connectionList.map((conn) => {
                    return { label: conn };
                });

                if(items.length === 0) return window.showWarningMessage(`Paste: Clipboard is empty for the namespace ${config.get<string>("namespace")!}.`);

                clipboardList.items = items;
                clipboardList.title = "Select Clipboard";
                clipboardList.ignoreFocusOut = persistInputBox;
            
                let didNotAcceptQuickPick = true;
                clipboardList.onDidAccept(async () => {
                    didNotAcceptQuickPick = false; clipboardList.dispose();

                    progress.report({ message: `Getting Clipboard From "${clipboardList.selectedItems[0].label}"` });
                    if(dir === undefined){
                        const clipboard = await getClipboardContent(config, clipboardList.selectedItems[0].label);

                        const editor = window.activeTextEditor;
                        if(!editor) {
                            resolve();
                            return window.showErrorMessage("No active editor found.");
                        }

                        if(clipboard){
                            if(clipboard.length === 1){
                                const selection = editor.selection;
                                const pasted = await editor.edit(editBuilder => {
                                    editBuilder.replace(selection, clipboard[0].content);
                                });

                                if(!pasted){
                                    resolve();
                                    return window.showWarningMessage("Paste: Error");
                                }
                                
                                resolve();
                                window.showInformationMessage(`Paste: "${clipboardList.selectedItems[0].label}" At Line ${selection.active.line + 1}`);
                            }else if(clipboard.length !== 0){
                                const getDefault = workspace.asRelativePath(editor.document.uri).split("/"); getDefault.pop();
                                const defaultPath = `${getDefault.join("/")}/`;

                                folderName.prompt = "Enter save path";
                                folderName.title = "Save To Folder";
                                folderName.placeholder = "My Folder";
                                folderName.value = defaultPath;
                                folderName.valueSelection = [defaultPath.length, defaultPath.length];
                                folderName.ignoreFocusOut = persistInputBox;

                                const saveDir = workspace.getWorkspaceFolder(editor.document.uri);
                                if(!saveDir){
                                    resolve();
                                    folderName.dispose();
                                    return window.showWarningMessage("Paste: Error");
                                }

                                let didNotEnterFolderName = true;
                                folderName.onDidAccept(() => {
                                    didNotEnterFolderName = false;
                                    folderName.dispose();
                                    resolve();
                                    vscodeClipboard(saveDir.uri.path, folderName.value, clipboard, clipboardList.selectedItems[0].label, config.get<boolean>("forcePaste", false));
                                });

                                folderName.onDidHide(() => {
                                    resolve();
                                    folderName.dispose();
                                    if(didNotEnterFolderName) window.showWarningMessage("Paste: Cancelled");
                                });

                                folderName.show();
                            }else{
                                resolve();
                                return window.showWarningMessage("Paste: Cancelled, clipboard is empty.");
                            }
                        }else{
                            resolve();
                            return window.showWarningMessage("Paste: Error");
                        }
                    }else{
                        const clipboard = await getClipboardContent(config, clipboardList.selectedItems[0].label);
                        if(clipboard){
                            if(clipboard.length === 1){
                                progress.report({ message: "Contains 1 File" });

                                fileName.prompt = "Create file name";
                                fileName.title = "Save As File";
                                fileName.placeholder = "File.js";
                                fileName.ignoreFocusOut = persistInputBox;
                                fileName.onDidChangeValue(value => {
                                    fileName.validationMessage = value.trim().length == 0 ? "File name cannot be empty" : undefined;
                                })
                                
                                let didNotEnterFileName = true;
                                fileName.onDidAccept(async () => {
                                    didNotEnterFileName = false;
                                    fileName.dispose();
                                    const filePath = Uri.file(path.join(dir, fileName.value));
                                    await workspace.fs.writeFile(filePath, Buffer.from(clipboard[0].content, "utf-8"));
                                    
                                    window.showInformationMessage(`Paste: "${clipboardList.selectedItems[0].label}" at "${fileName.value}"`);
                                    const createdFile = await workspace.openTextDocument(filePath);
                                    await window.showTextDocument(createdFile);
                                    resolve();
                                });
                                
                                fileName.onDidHide(() => {
                                    resolve();
                                    fileName.dispose();
                                    if(didNotEnterFileName) window.showWarningMessage("Paste: Cancelled");
                                });

                                fileName.show();
                            }else if(clipboard.length !== 0){
                                progress.report({ message: "Contains Multiple Files" });

                                folderName.prompt = "Enter save path";
                                folderName.title = "Save To Folder";
                                folderName.placeholder = "My Folder";
                                folderName.ignoreFocusOut = persistInputBox;

                                let didNotEnterFolderName = true;
                                folderName.onDidAccept(() => {
                                    didNotEnterFolderName = false;
                                    folderName.dispose();
                                    resolve();
                                    vscodeClipboard(dir, folderName.value, clipboard, clipboardList.selectedItems[0].label, config.get<boolean>("forcePaste")!);
                                });

                                folderName.onDidHide(() => {
                                    if(didNotEnterFolderName) window.showWarningMessage("Paste: Cancelled");
                                    folderName.dispose();
                                    resolve();
                                });

                                folderName.show();
                            }else{
                                resolve();
                                return window.showWarningMessage("Paste: Cancelled, clipboard is empty.");
                            }
                        }else{
                            resolve();
                            return window.showWarningMessage("Paste: Error");
                        }
                    }
                });

                clipboardList.onDidHide(() => {
                    if(didNotAcceptQuickPick) {
                        window.showWarningMessage("Paste: Cancelled");
                        resolve();
                    }
                    clipboardList.dispose();
                });

                clipboardList.show();
            });
        });
    }catch{
        window.showErrorMessage("An error occurred. Error ID: PASTE");
    }
}

async function vscodeClipboard(saveDir: string, folderName: string, clipboardContents: ClipboardData[], clipboard: string, forcePaste: boolean) {
    try{
        const savePath = Uri.joinPath(Uri.file(saveDir), folderName);
        await workspace.fs.createDirectory(savePath);

        let isSaved = false;
        await Promise.all(clipboardContents.map(async (data) => {
            const filePath = Uri.joinPath(Uri.file(saveDir), folderName, data.path);

            try{
                await workspace.fs.stat(filePath);

                if(forcePaste){
                    save(filePath, data);
                    isSaved = true;
                }else{
                    const overwrite = await window.showWarningMessage(`A file named "${filePath.path.split('/').pop()}" already exists. Do you want to overwrite it?`, { modal: true }, "Yes", "No");
                    if(overwrite === "Yes"){
                        save(filePath, data);
                        isSaved = true;
                    }
                }
            }catch{
                save(filePath, data);
                isSaved = true;
            }
        }));

        isSaved ? window.showInformationMessage(`Pasted "${clipboard}" at "${savePath.path.split("/").pop() === workspace.name ? savePath.path.split("/").pop() : workspace.asRelativePath(savePath).split("\\").pop()}"`) : window.showWarningMessage("Paste: Cancelled");
    }catch{
        window.showErrorMessage("Couldn't find the information you requested. It may have been moved or deleted. Error ID: PASTE_MULTI");
    }
}

async function save(filePath: Uri, data: {content: string}){
    await workspace.fs.writeFile(filePath, Buffer.from(data.content, "utf-8"));
    const createdFile = await workspace.openTextDocument(filePath);
    await window.showTextDocument(createdFile);
}