import * as vscode from 'vscode';
import { ResxProvider } from './resxProvider';
import { AppConstants } from './utilities/constants';

let outputChannel: vscode.OutputChannel;

export function activate(context: vscode.ExtensionContext) {

	outputChannel = vscode.window.createOutputChannel("ResX Editor");

	printChannelOutput("ResX Editor extension activated.", true);

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

/**
 * Prints the given content on the output channel.
 *
 * @param content The content to be printed.
 * @param reveal Whether the output channel should be revealed.
 */
export const printChannelOutput = (content: string, verbose: boolean, reveal = false): void => {

	// do not throw on logging, just log to console in the event of an error
	try {
		if (!outputChannel) {
			return;
		}
		// if it is verbose logging and verbose is not enabled, return
		if (verbose && !vscode.workspace.getConfiguration("resx-editor").get("verboseLogging")) {
			return;
		}

		const timestamp = new Date().toISOString();

		outputChannel.appendLine(`[${timestamp}] ${content}`);

		if (reveal) {
			outputChannel.show(true);
		}
	}
	catch (e) {
		console.log(e);
	}
};

export function deactivate() { }
