import { commands, Uri, window, ExtensionContext } from "vscode";
import paste from "./commands/paste";
import copy from "./commands/copy";
import getDirectory from "./utils/getDirectory";

export default function registerAllCommands(context: ExtensionContext) {
    context.subscriptions.push(commands.registerCommand('cloudclipboard.copy', async(uri: Uri, uris: Uri[]) => {
        try{
            if(!uris || uris.length === 0) return window.showWarningMessage('Please select one or more files or directories.');
            copy(uris);
        }catch{
            window.showErrorMessage('Error selecting directory.');
        }
    }));
    context.subscriptions.push(commands.registerCommand('cloudclipboard.editorCopy', () => {
        copy(undefined);
    }));
    context.subscriptions.push(commands.registerCommand('cloudclipboard.paste', async(uri?: Uri) => {
        try{
            const dir = await getDirectory(uri);
            if(!dir) return window.showWarningMessage('Please select a directory.');
            paste(dir);
        }catch{
            window.showErrorMessage('Error selecting directory.');
        }
    }));
    context.subscriptions.push(commands.registerCommand('cloudclipboard.editorPaste', () => {
        paste(undefined);
    }));
}