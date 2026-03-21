import { Uri, window, workspace } from "vscode";
import path = require("path");
import saveClipboardContent from "../utils/saveClipboardContent";

export default async function copy(dir: string | undefined){
    try{
        const config: string = workspace.getConfiguration("cloudclipboard").get<string>("configuration")!;
    
        if(config.trim().length === 0) {
            window.showWarningMessage("Clipboard API Endpoint is not set. Please configure it in the extension settings.");
            return;
        }
    
        const editor = window.activeTextEditor;
        if(!editor) return window.showErrorMessage("No active editor found.");
        
        const selection = editor.selection;
        const content = editor.document.getText(selection);
        if(content.trim().length === 0) return window.showWarningMessage('Please highlight content to save.');
        
        const connection = await window.showInputBox({ prompt: "Save As" });
        if(connection){
            if(dir === undefined){
                const saved = await saveClipboardContent(config, connection, content);
                if(saved === 200){
                    window.showInformationMessage(`Copied ${connection} to cloud clipboard.`);
                }else{
                    window.showErrorMessage('An error occured while copying to cloud clipboard.');
                }
            }else{

            }
        }else{
            window.showWarningMessage('Copy cancelled.');
        }
    }catch{
        window.showErrorMessage('Copy error.');
    }
}