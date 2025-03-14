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

export enum LogLevel {
    Info = 'INF',
    Warn = 'WRN',
    Error = 'ERR'
}

/**
 * Prints the given content on the output channel.
 *
 * @param content The content to be printed.
 * @param verbose Whether this should be included only in verbose logging
 * @param reveal Whether the output channel should be revealed.
 * @param level The log level for the output.
 */
export const printChannelOutput = (content: string, verbose: boolean, reveal = false, level: LogLevel = LogLevel.Info): void => {
    try {
        if (!outputChannel) {
            return;
        }
        if (verbose && !vscode.workspace.getConfiguration("resx-editor").get("verboseLogging")) {
            return;
        }

        const timestamp = new Date().toISOString();

        outputChannel.appendLine(`[${timestamp}] [${level}] ${content}`);

        if (reveal) {
            outputChannel.show(true);
        }
    }
    catch (e) {
        console.log(e);
    }
};

export function deactivate() { }
