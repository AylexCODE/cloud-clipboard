import { Uri, window, workspace } from "vscode";
import path = require("path");

import getConnections from "../utils/getConnectionLists";
import getDirectory from "../utils/getDirectory";
import getClipboardContent from "../utils/getClipboardContent";
import { ClipboardData } from "../types";

export default async function paste(dir: string | undefined) {    
    try{
        const config = workspace.getConfiguration("cloudclipboard");

        const connectionList = await getConnections(config);
        if(connectionList === undefined){
            window.showWarningMessage("Cloud Clipboard is not configured correctly. Please configure it in the extension settings.");
            return;
        }

        const items = connectionList.map((conn) => {
            return { label: conn };
        });

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

                        if(!pasted) return window.showWarningMessage('Paste error.');
                        
                        window.showInformationMessage(`Pasted ${clipboardList.label} at line ${selection.active.line + 1}`);
                    }else if(clipboard.length !== 0){
                        const folderName = await window.showInputBox({ prompt: "Save To Folder" });
                        if(!folderName) return window.showWarningMessage(`Paste cancelled.`);

                        const saveDir = workspace.getWorkspaceFolder(editor.document.uri);
                        if(!saveDir) return window.showWarningMessage('Paste error.');

                        vscodeClipboard(saveDir.uri.path, folderName, clipboard, clipboardList.label);
                    }else{
                        return window.showWarningMessage('Paste error.');
                    }
                }else{
                    return window.showWarningMessage('Paste error.');
                }
            }else{
                const clipboard = await getClipboardContent(config, clipboardList.label);
                if(clipboard){
                    if(clipboard.length === 1){
                        const fileName = await window.showInputBox({ prompt: "Save As" });
                        if(!fileName) return window.showWarningMessage(`Paste cancelled.`);
                        
                        const filePath = Uri.file(path.join(dir, fileName));
                        await workspace.fs.writeFile(filePath, Buffer.from(clipboard[0].content, 'utf-8'));

                        window.showInformationMessage(`Pasted ${clipboardList.label} at ${fileName}`);
                        const createdFile = await workspace.openTextDocument(filePath);
                        await window.showTextDocument(createdFile);
                    }else if(clipboard.length !== 0){
                        const folderName = await window.showInputBox({ prompt: "Save To Folder" });
                        if(!folderName) return window.showWarningMessage(`Paste cancelled.`);

                        vscodeClipboard(dir, folderName, clipboard, clipboardList.label);
                    }else{
                        return window.showWarningMessage('Paste error.');
                    }
                }else{
                    return window.showWarningMessage('Paste error.');
                }
            }
        }else{
            window.showWarningMessage('Paste cancelled.');
        }
    }catch{
        window.showErrorMessage('Paste error.');
    }
}

async function vscodeClipboard(saveDir: string, folderName: string, clipboard: ClipboardData[], connection: string) {
    await workspace.fs.createDirectory(Uri.file(path.join(saveDir, folderName)));

    clipboard.forEach(async (data) => {
        const filePath = Uri.joinPath(Uri.file(saveDir), folderName, data.file);
        await workspace.fs.writeFile(filePath, Buffer.from(data.content, 'utf-8'));
        const createdFile = await workspace.openTextDocument(filePath);
        await window.showTextDocument(createdFile);
    });

    window.showInformationMessage(`Pasted ${connection} at ${folderName}`);
}