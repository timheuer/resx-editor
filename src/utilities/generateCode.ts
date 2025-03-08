import * as vscode from 'vscode';
import { generateDesignerCode } from './designerGenerator';
import { printChannelOutput } from '../extension';

export async function generateAndUpdateDesignerFile(document: vscode.TextDocument, parsedJson: any): Promise<void> {
    // Check if code generation is enabled
    const config = vscode.workspace.getConfiguration('resx-editor');
    const generateCode = config.get<boolean>('generateCode', false);

    if (generateCode) {
        // Generate and update the Designer.cs file
        const designerPath = document.uri.fsPath.replace('.resx', '.Designer.cs');
        const designerUri = vscode.Uri.file(designerPath);
        const designerCode = generateDesignerCode(document.uri.fsPath, parsedJson);

        try {
            await vscode.workspace.fs.stat(designerUri);
            // File exists, write contents directly
            printChannelOutput(`Updating existing Designer file at ${designerPath}`, true);
            await vscode.workspace.fs.writeFile(designerUri, Buffer.from(designerCode, 'utf8'));
        } catch {
            // File doesn't exist, create it
            printChannelOutput(`Creating new Designer file at ${designerPath}`, true);
            await vscode.workspace.fs.writeFile(designerUri, Buffer.from(designerCode, 'utf8'));
        }
    } else {
        printChannelOutput('Code generation is disabled, skipping Designer.cs file update', true);
    }
}