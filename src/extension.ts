import * as vscode from 'vscode';
import { ResxProvider } from './resxProvider';
import { AppConstants } from './utilities/constants';
import { Logger } from './logger';

let outputChannel: vscode.LogOutputChannel;

export function activate(context: vscode.ExtensionContext) {

	outputChannel = vscode.window.createOutputChannel("ResX Editor", { log: true });

	Logger.instance.info("ResX Editor extension activated.");

	let openPreviewCommand = vscode.commands.registerCommand(AppConstants.openPreviewCommand, () => {

		const editor = vscode.window.activeTextEditor;

		vscode.commands.executeCommand('vscode.openWith',
			editor?.document?.uri,
			AppConstants.viewTypeId,
			{
				preview: true,
				viewColumn: vscode.ViewColumn.Beside
			});
	});

	let openInResxEditor = vscode.commands.registerCommand(AppConstants.openInResxEditorCommand, () => {

		const editor = vscode.window.activeTextEditor;

		vscode.commands.executeCommand('vscode.openWith',
			editor?.document?.uri,
			AppConstants.viewTypeId,
			{
				preview: false,
				viewColumn: vscode.ViewColumn.Active
			});
	});

	context.subscriptions.push(openPreviewCommand);
	context.subscriptions.push(openInResxEditor);
	context.subscriptions.push(ResxProvider.register(context));

}

export function deactivate() { }
