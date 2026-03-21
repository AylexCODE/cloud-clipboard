import { Uri, window, workspace } from "vscode";
import getConnections from "../utils/getConnections";
import getDirectory from "../utils/getDirectory";
import path = require("path");
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
            const clipboard = await getClipboardContent(config, connection.label);
            
            if(dir === undefined){
                const editor = window.activeTextEditor;
                if(!editor) return window.showErrorMessage("No active editor found.");

                const pasted = await editor.edit(editBuilder => {
                    editBuilder.insert(editor.selection.active, clipboard);
                })
            }else{
                const fileName = await window.showInputBox({ prompt: "Save As" });
                if(fileName){
                    const filePath = Uri.file(path.join(dir, fileName));
                    await workspace.fs.writeFile(filePath, Buffer.from(clipboard, 'utf-8'));

                    window.showInformationMessage(`Pasted ${connection.label} at ${fileName}`);
                    const createdFile = await workspace.openTextDocument(filePath);
                    await window.showTextDocument(createdFile);
                }else{
                    window.showWarningMessage(`Paste cancelled.`);
                }
            }
        }else{
            window.showWarningMessage('Paste cancelled.');
        }
    }catch{
        window.showErrorMessage('Error pasting.');
    }
}