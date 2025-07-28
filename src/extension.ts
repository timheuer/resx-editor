import * as vscode from 'vscode';
import { ResxProvider } from './resxProvider';
import { AppConstants } from './utilities/constants';
import { createLoggerFromConfig, Logger, LogLevel } from '@timheuer/vscode-ext-logger';

let outputChannel: Logger;

export function activate(context: vscode.ExtensionContext) {

	outputChannel = createLoggerFromConfig('ResX Editor', 'resx-editor', 'loggingLevel', 'info', true, context);

	outputChannel.info("ResX Editor extension activated.");

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
	context.subscriptions.push(ResxProvider.register(context, outputChannel));

	// Monitor for configuration changes and update log level
	const configChangeSubscription = vscode.workspace.onDidChangeConfiguration(e => {
		if (e.affectsConfiguration('resx-editor.loggingLevel')) {
			const config = vscode.workspace.getConfiguration('resx-editor');
			const logLevel = config.get<string>('loggingLevel', 'info');
			outputChannel.setLevel(logLevel as unknown as LogLevel);
			outputChannel.info(`Log level changed to: ${logLevel}`);
		}
	});

	context.subscriptions.push(configChangeSubscription);

}

export function deactivate() { }
