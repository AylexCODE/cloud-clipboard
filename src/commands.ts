import { commands, type ExtensionContext } from "vscode";
import paste from "./commands/paste";
import copy from "./commands/copy";

export default function registerAllCommands(context: ExtensionContext) {
    context.subscriptions.push(commands.registerCommand('cloudclipboard.copy', () => {
        copy();
    }));
    context.subscriptions.push(commands.registerCommand('cloudclipboard.paste', () => {
        paste();
    }));
}