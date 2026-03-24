import { commands, Uri, window, workspace } from "vscode";
import { ClipboardData } from "../types";
import saveClipboardContent from "../utils/saveClipboardContent";
import getFiles from "../utils/getFiles";

export default async function copy(dirs: Uri[] | undefined){
    try{
        const config = workspace.getConfiguration("cloudclipboard");
    
        if(config.get<string>("endpoint")!.trim().length === 0 || config.get<string>("namespace")!.trim().length === 0) {
            return window.showInformationMessage("Cloud Clipboard is not configured correctly. Please configure it in the extension settings.", "Open Settings").then(selection => {
                if (selection === "Open Settings") {
                    commands.executeCommand("workbench.action.openSettings", "@ext:AylexCODE.cloud-clipboard");
                }
            });
        }
    
        const editor = window.activeTextEditor;
        if(!editor && dirs === undefined) return window.showErrorMessage("No active editor found.");

        if(dirs === undefined && editor) if(editor.document.getText(editor.selection).trim().length === 0) return window.showWarningMessage("Please highlight content to save.");
        
        const clipboard = await window.showInputBox({
            prompt: "Create clipboard",
            title: "Copy As",
            ignoreFocusOut: config.get<boolean>("persistInputBox", true),
            validateInput: input => {
                return input.trim().length <= 64 ? null : "Clipboard name cannot be greater than 64"
            }
        });

        if(clipboard){
            if(dirs === undefined){
                if(!editor) return window.showErrorMessage("No active editor found.");
                const content = editor.document.getText(editor.selection);

                const saveStatus = await saveClipboardContent(config, clipboard, [{path: "", content: content}]);
                if(saveStatus?.status === 404 && saveStatus.text === "Not Found") {
                    return window.showInformationMessage("Cloud Clipboard is not configured correctly. Please configure it in the extension settings.", "Open Settings").then(selection => {
                        if(selection === "Open Settings"){
                            commands.executeCommand("workbench.action.openSettings", "@ext:AylexCODE.cloud-clipboard");
                        }
                    });
                }

                if(saveStatus?.status === 200){
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
                                path: workspace.asRelativePath(file),
                                content: fileContent
                            })
                        }catch{
                            window.showErrorMessage(`Failed to copy ${file}.`);
                        }
                    }
                }

                const saveStatus = await saveClipboardContent(config, clipboard, contents);
                if(saveStatus?.status === 404 && saveStatus.text === "Not Found") {
                    return window.showInformationMessage("Cloud Clipboard is not configured correctly. Please configure it in the extension settings.", "Open Settings").then(selection => {
                        if (selection === "Open Settings") {
                            commands.executeCommand("workbench.action.openSettings", "@ext:AylexCODE.cloud-clipboard");
                        }
                    });
                }

                if(saveStatus?.status === 200){
                    window.showInformationMessage(`Copied ${clipboard} to cloud clipboard.`);
                }else{
                    window.showErrorMessage("An error occured while copying to cloud clipboard.");
                }

            }
        }else{
            window.showWarningMessage("Copy cancelled.");
        }
    }catch{
        window.showErrorMessage("An error occured. Error ID: COPY");
    }
}