import * as vscode from 'vscode';
import { ResxProvider } from './resxProvider';


export function activate(context: vscode.ExtensionContext) {

	// The command has been defined in the package.json file
	// Now provide the implementation of the command with registerCommand
	// The commandId parameter must match the command field in package.json
	let disposable = vscode.commands.registerCommand('resx-viewer.helloWorld', () => {
		// The code you place here will be executed every time your command is executed
		// Display a message box to the user
		//HelloWorldPanel.render(context.extensionUri);
	});

	context.subscriptions.push(ResxProvider.register(context));
	context.subscriptions.push(disposable);
}

export function deactivate() {}
