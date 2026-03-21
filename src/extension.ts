import { ExtensionContext } from 'vscode';
import registerAllCommands from './commands';

export function activate(context: ExtensionContext) {
	registerAllCommands(context);
}