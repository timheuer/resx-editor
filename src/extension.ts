import * as vscode from 'vscode';
import { ResxProvider } from './resxProvider';


export function activate(context: vscode.ExtensionContext) {
	

	let disposable = vscode.commands.registerCommand('resx-editor.deleteResource', () => {
		vscode.window.showInformationMessage('Hello World from Resx!');
	});
	
	context.subscriptions.push(disposable);
	context.subscriptions.push(ResxProvider.register(context));
	
}

export function deactivate() {}
