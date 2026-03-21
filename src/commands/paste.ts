import { Uri, window, workspace } from "vscode";
import path = require("path");

import getConnections from "../utils/getConnections";
import getDirectory from "../utils/getDirectory";
import getClipboardContent from "../utils/getClipboardContent";

export default async function paste(dir: string | undefined) {    
    try{
        const config: string = workspace.getConfiguration("cloudclipboard").get<string>("configuration")!;

        if(config.trim().length === 0) {
            window.showWarningMessage("Clipboard API Endpoint is not set. Please configure it in the extension settings.");
            return;
        }

        const items = (await getConnections(config)).split("\n").filter(Boolean).map((conn) => {
            return { label: conn };
        });

        const connection = await window.showQuickPick(items, {
            canPickMany: false,
            title: "Select Clipboard"
        });

        if(connection?.label){
            if(dir === undefined){
                const clipboard = await getClipboardContent(config, connection.label);
                const editor = window.activeTextEditor;
                if(!editor) return window.showErrorMessage("No active editor found.");

                if(clipboard.startsWith("vscode")){
                    const folderName = await window.showInputBox({ prompt: "Save To Folder" });
                    if(!folderName) return window.showWarningMessage(`Paste cancelled.`);

                    const saveDir = workspace.getWorkspaceFolder(editor.document.uri);
                    if(!saveDir) return window.showWarningMessage('Paste error.');

                    const directories = clipboard.split("/****************").filter(t => t !== "/****************").filter(Boolean);
                    await workspace.fs.createDirectory(Uri.file(path.join(saveDir.uri.path, folderName)));
                    for(let i = 1; i < directories.length; i++){
                        if(directories[i].startsWith("\n//* vscode ")){
                            const filePath = Uri.joinPath(Uri.file(saveDir.uri.path), folderName, directories[i].replace("//* vscode ", '').trim());
                            await workspace.fs.writeFile(filePath, Buffer.from(directories[i+1].trim(), 'utf-8'));
                        }
                    }
                }else{
                    const selection = editor.selection;
                    const pasted = await editor.edit(editBuilder => {
                        editBuilder.replace(selection, clipboard);
                    });

                    if(!pasted) return window.showWarningMessage('Paste error.');
                    
                    window.showInformationMessage(`Pasted ${connection.label} at line ${selection.active.line + 1}`);
                }
            }else{
                const fileName = await window.showInputBox({ prompt: "Save As" });
                if(!fileName) return window.showWarningMessage(`Paste cancelled.`);

                const clipboard = await getClipboardContent(config, connection.label);
                
                const filePath = Uri.file(path.join(dir, fileName));
                await workspace.fs.writeFile(filePath, Buffer.from(clipboard, 'utf-8'));

                window.showInformationMessage(`Pasted ${connection.label} at ${fileName}`);
                const createdFile = await workspace.openTextDocument(filePath);
                await window.showTextDocument(createdFile);
            }
        }else{
            window.showWarningMessage('Paste cancelled.');
        }
    }catch{
        window.showErrorMessage('Paste error.');
    }
}