import * as vscode from 'vscode';
import { ResxProvider } from './resxProvider';


export function activate(context: vscode.ExtensionContext) {
	
	context.subscriptions.push(ResxProvider.register(context));
	
}

export function deactivate() {}
