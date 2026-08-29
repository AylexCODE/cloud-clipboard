import { ExtensionContext, workspace } from 'vscode';
import registerAllCommands from './commands';
import warnIfDefaultEndpoint from './utils/warnIfDefaultEndpoint';
import createStatusBarItem from './utils/createStatusBarItem';
import watchNamespaceProfiles from './utils/watchNamespaceProfiles';

export function activate(context: ExtensionContext) {
	registerAllCommands(context);
	warnIfDefaultEndpoint(context, workspace.getConfiguration("cloudclipboard"));
	createStatusBarItem(context);
	context.subscriptions.push(watchNamespaceProfiles(context));
}