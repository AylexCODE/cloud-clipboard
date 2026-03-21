import { commands, Uri, window, type ExtensionContext } from "vscode";
import paste from "./commands/paste";
import copy from "./commands/copy";
import getDirectory from "./utils/getDirectory";

export default function registerAllCommands(context: ExtensionContext) {
    context.subscriptions.push(commands.registerCommand('cloudclipboard.copy', async(uri: Uri) => {
        copy();
    }));
    context.subscriptions.push(commands.registerCommand('cloudclipboard.paste', async(uri?: Uri) => {
        try{
            const dir = await getDirectory(uri);
            if(!dir) return window.showWarningMessage('Select a directory first.');
            paste(dir);
        }catch{
            window.showErrorMessage('Error selecting directory.');
        }
    }));
    context.subscriptions.push(commands.registerCommand('cloudclipboard.editorPaste', () => {
        paste(undefined);
    }));
}