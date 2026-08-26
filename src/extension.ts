import { ExtensionContext, workspace } from 'vscode';
import registerAllCommands from './commands';
import warnIfDefaultEndpoint from './utils/warnIfDefaultEndpoint';
import createStatusBarItem from './utils/createStatusBarItem';

export function activate(context: ExtensionContext) {
	registerAllCommands(context);
	warnIfDefaultEndpoint(context, workspace.getConfiguration("cloudclipboard"));
	createStatusBarItem(context);
}