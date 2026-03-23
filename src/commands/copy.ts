import { commands, Uri, window, workspace } from "vscode";
import path = require("path");
import saveClipboardContent from "../utils/saveClipboardContent";
import getFiles from "../utils/getFiles";
import { ClipboardData } from "../types";

export default async function copy(dirs: Uri[] | undefined){
    try{
        const config = workspace.getConfiguration("cloudclipboard");
    
        if(config.get<string>("endpoint")!.trim().length === 0 || config.get<string>("namespace")!.trim().length === 0) {
            window.showInformationMessage("Cloud Clipboard is not configured correctly. Please configure it in the extension settings.", "Open Settings").then(selection => {
                if (selection === "Open Settings") {
                    commands.executeCommand("workbench.action.openSettings", "@ext:AylexCODE.cloud-clipboard");
                }
            });
            return;
        }
    
        const editor = window.activeTextEditor;
        if(!editor) return window.showErrorMessage("No active editor found.");
        
        const selection = editor.selection;
        const content = editor.document.getText(selection);

        if(dirs === undefined) if(content.trim().length === 0) return window.showWarningMessage("Please highlight content to save.");
        
        const clipboard = await window.showInputBox({ prompt: "Copy As" });
        if(clipboard){
            if(dirs === undefined){
                const saved = await saveClipboardContent(config, clipboard, [{file: "", content: content}]);
                if(saved === 200){
                    window.showInformationMessage(`Copied ${clipboard} to cloud clipboard.`);
                }else{
                    window.showErrorMessage("An error occured while copying to cloud clipboard.");
                }
            }else{
                let contents: ClipboardData[] = [];

                for(const dir of dirs){
                    const files = await getFiles(dir);

                    for(const file of files){
                        try{
                            const fileContent = Buffer.from(await workspace.fs.readFile(file)).toString('utf-8');
                            contents.push({
                                file: workspace.asRelativePath(file),
                                content: fileContent
                            })
                        }catch{
                            window.showErrorMessage(`Failed to copy ${file}`);
                        }
                    }
                }

                const saveStatus = await saveClipboardContent(config, clipboard, contents);
                if(saveStatus === 200){
                    window.showInformationMessage(`Copied ${clipboard} to cloud clipboard.`);
                }else{
                    window.showErrorMessage("An error occured while copying to cloud clipboard.");
                }

            }
        }else{
            window.showWarningMessage("Copy cancelled.");
        }
    }catch{
        window.showErrorMessage("An error occured.");
    }
}