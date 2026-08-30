import { commands, Uri, window, ExtensionContext } from "vscode";
import paste from "./commands/paste";
import copy from "./commands/copy";
import getDirectory from "./utils/getDirectory";
import del from "./commands/delete";
import switchNamespaceProfile from "./commands/switchNamespaceProfile";
import clearLocalCache from "./commands/clearCache";

export default function registerAllCommands(context: ExtensionContext) {
    context.subscriptions.push(commands.registerCommand('cloudclipboard.copy', async(uri: Uri, uris: Uri[]) => {
        try{
            if(!uris || uris.length === 0){
                window.showWarningMessage('Please select one or more files or directories, and right click on one of them.');
                return;
            }
            copy(uris, context);
        }catch(error){console.error(error); window.showErrorMessage('Error selecting directory.')}
    }));
    context.subscriptions.push(commands.registerCommand('cloudclipboard.editorCopy', () => {copy(undefined, context)}));
    context.subscriptions.push(commands.registerCommand('cloudclipboard.paste', async(uri?: Uri) => {
        try{
            const dir = await getDirectory(uri);
            if(!dir){
                window.showWarningMessage('Please select a directory.');
                return;
            }
            paste(dir, context);
        }catch(error){console.error(error); window.showErrorMessage('Error selecting directory.')}
    }));
    context.subscriptions.push(commands.registerCommand('cloudclipboard.editorPaste', () => {paste(undefined, context)}));
    context.subscriptions.push(commands.registerCommand('cloudclipboard.delete', () => {del(context)}));
    context.subscriptions.push(commands.registerCommand('cloudclipboard.switchNamespaceProfile', () => {switchNamespaceProfile(context)}));
    context.subscriptions.push(commands.registerCommand('cloudclipboard.clearCache', () => {clearLocalCache(context)}));
}
