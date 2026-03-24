import { commands, Uri, window, workspace } from "vscode";
import { ClipboardData } from "../types";
import saveClipboardContent from "../utils/saveClipboardContent";
import getFiles from "../utils/getFiles";
import path = require("path");

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

                const totalBytes = (await workspace.fs.stat(editor.document.uri)).size;

                const saveStatus = await saveClipboardContent(config, clipboard, [{path: "-", content: content}]);
                if(saveStatus?.status === 404 && saveStatus.text === "Not Found") {
                    return window.showInformationMessage("Cloud Clipboard is not configured correctly. Please configure it in the extension settings.", "Open Settings").then(selection => {
                        if(selection === "Open Settings"){
                            commands.executeCommand("workbench.action.openSettings", "@ext:AylexCODE.cloud-clipboard");
                        }
                    });
                }

                copyStatus(saveStatus?.status, totalBytes, clipboard);
            }else{
                const contents: ClipboardData[] = [];
                let totalBytes: number = 0;

                const splitPaths = dirs.map(p => workspace.asRelativePath(p.path).split('/'));
                const minLength = Math.min(...splitPaths.map(p => p.length));
                let commonCount = 0;

                for(let i = 0; i < minLength - 1; i++){ // minLength - 1 ensures we don't accidentally remove the filename
                    const segment = splitPaths[0][i];
                    const isCommon = splitPaths.every(p => p[i] === segment);

                    if (isCommon) {
                        commonCount++;
                    } else {
                        break;
                    }
                }

                for(const dir of dirs){
                    const files = await getFiles(dir);

                    totalBytes = files.bytes;
                    
                    for(const file of files.files){
                        try{
                            const fileContent = Buffer.from(await workspace.fs.readFile(file)).toString('utf-8');
                            contents.push({
                                path: workspace.asRelativePath(file.path).split('/').slice(commonCount).join('/'),
                                content: fileContent
                            })
                        }catch{
                            return window.showErrorMessage(`Failed to copy ${workspace.asRelativePath(file)}.`);
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

                copyStatus(saveStatus?.status, totalBytes, clipboard);
            }
        }else{
            window.showWarningMessage("Copy cancelled.");
        }
    }catch{
        window.showErrorMessage("An error occurred. Error ID: COPY");
    }
}

function copyStatus(status: number | undefined, totalBytes: number, clipboard: string){
    if(status === 200){
        window.showInformationMessage(`Copied ${clipboard} to cloud clipboard.`);
    }else if(status === 413){
        window.showErrorMessage(`Total selected files cannot exceed 1 MiB. Your selection is ${(totalBytes / 1048576).toFixed(2)} MiB`);
    }else{
        window.showErrorMessage("An error occurred while copying to cloud clipboard.");
    }
}