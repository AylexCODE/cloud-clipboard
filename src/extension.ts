import * as vscode from 'vscode';

export function activate(context: vscode.ExtensionContext) {
	const command = vscode.commands.registerCommand('cloudclipboard.paste', () => {
		vscode.window.showInformationMessage('Cloud Clipboard');
	});

	context.subscriptions.push(command);
}