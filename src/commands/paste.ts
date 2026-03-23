import { commands, Uri, window, workspace } from "vscode";
import path = require("path");

import getClipboards from "../utils/getClipboardList";
import getClipboardContent from "../utils/getClipboardContent";
import { ClipboardData } from "../types";

export default async function paste(dir: string | undefined) {    
    try{
        const config = workspace.getConfiguration("cloudclipboard");

        const connectionList = await getClipboards(config);
        if(connectionList === undefined){
            window.showInformationMessage("Cloud Clipboard is not configured correctly. Please configure it in the extension settings.", "Open Settings").then(selection => {
                if (selection === "Open Settings") {
                    commands.executeCommand("workbench.action.openSettings", "@ext:AylexCODE.cloud-clipboard");
                }
            });
            return;
        }

        const items = connectionList.map((conn) => {
            return { label: conn };
        });

        if(items.length === 0) return window.showWarningMessage(`Clipboard is empty for the namespace ${config.get<string>("namespace")!}`);

        const clipboardList = await window.showQuickPick(items, {
            canPickMany: false,
            title: "Select Clipboard"
        });

        if(clipboardList?.label){
            if(dir === undefined){
                const editor = window.activeTextEditor;
                if(!editor) return window.showErrorMessage("No active editor found.");
                
                const clipboard = await getClipboardContent(config, clipboardList.label);
                if(clipboard){
                    if(clipboard.length === 1){
                        const selection = editor.selection;
                        const pasted = await editor.edit(editBuilder => {
                            editBuilder.replace(selection, clipboard[0].content);
                        });

                        if(!pasted) return window.showWarningMessage("Paste error.");
                        
                        window.showInformationMessage(`Pasted ${clipboardList.label} at line ${selection.active.line + 1}`);
                    }else if(clipboard.length !== 0){
                        const folderName = await window.showInputBox({ prompt: "Save To Folder" });
                        if(!folderName) return window.showWarningMessage("Paste cancelled.");

                        const saveDir = workspace.getWorkspaceFolder(editor.document.uri);
                        if(!saveDir) return window.showWarningMessage("Paste error.");

                        vscodeClipboard(saveDir.uri.path, folderName, clipboard, clipboardList.label, config.get<boolean>("forcePaste")!);
                    }else{
                        return window.showWarningMessage("Paste cancelled, clipboard is empty.");
                    }
                }else{
                    return window.showWarningMessage("Paste error.");
                }
            }else{
                const clipboard = await getClipboardContent(config, clipboardList.label);
                if(clipboard){
                    if(clipboard.length === 1){
                        const fileName = await window.showInputBox({ prompt: "Save As File" });
                        if(!fileName) return window.showWarningMessage("Paste cancelled.");
                        
                        const filePath = Uri.file(path.join(dir, fileName));
                        await workspace.fs.writeFile(filePath, Buffer.from(clipboard[0].content, "utf-8"));

                        window.showInformationMessage(`Pasted ${clipboardList.label} at ${fileName}`);
                        const createdFile = await workspace.openTextDocument(filePath);
                        await window.showTextDocument(createdFile);
                    }else if(clipboard.length !== 0){
                        const folderName = await window.showInputBox({ prompt: "Save To Folder" });
                        if(!folderName) return window.showWarningMessage("Paste cancelled.");

                        vscodeClipboard(dir, folderName, clipboard, clipboardList.label, config.get<boolean>("forcePaste")!);
                    }else{
                        return window.showWarningMessage("Paste cancelled, clipboard is empty.");
                    }
                }else{
                    return window.showWarningMessage("Paste error.");
                }
            }
        }else{
            window.showWarningMessage("Paste cancelled.");
        }
    }catch{
        window.showErrorMessage("An error occured.");
    }
}

async function vscodeClipboard(saveDir: string, folderName: string, clipboardContents: ClipboardData[], clipboard: string, forcePaste: boolean) {
    if(folderName !== "-") await workspace.fs.createDirectory(Uri.file(path.join(saveDir, folderName)));

    let isSaved = false;
    await Promise.all(clipboardContents.map(async (data) => {
        const filePath = folderName === "-" ? Uri.joinPath(Uri.file(saveDir), data.file) : Uri.joinPath(Uri.file(saveDir), folderName, data.file);

        try{
            await workspace.fs.stat(filePath);

            const overwrite = await window.showWarningMessage(`A file named "${filePath.path.split('/').pop()}" already exists. Do you want to overwrite it?`, { modal: true }, "Yes", "No");
            if(overwrite === "Yes" || forcePaste){
                save(filePath, data);
                isSaved = true;
            }
        }catch{
            save(filePath, data);
        }
    }));
    
    isSaved ? window.showInformationMessage(`Pasted ${clipboard} at ${folderName !== "-" ? folderName : "the selected directory"}.`) : window.showWarningMessage("Paste cancelled.");
}

async function save(filePath: Uri, data: {content: string}){
    await workspace.fs.writeFile(filePath, Buffer.from(data.content, "utf-8"));
    const createdFile = await workspace.openTextDocument(filePath);
    await window.showTextDocument(createdFile);
}