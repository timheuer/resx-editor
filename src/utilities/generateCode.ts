import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import { generateDesignerCode } from './designerGenerator';
import { printChannelOutput } from '../extension';

async function checkResxGeneratorType(resxPath: string): Promise<'public' | 'internal'> {
    // Look for a .csproj file in the same directory or parent directories
    const dir = path.dirname(resxPath);
    const csprojFiles = await vscode.workspace.findFiles(
        new vscode.RelativePattern(dir, '**/*.csproj')
    );

    if (csprojFiles.length === 0) {
        return 'public'; // Default to public if no .csproj is found
    }

    const resxFileName = path.basename(resxPath);

    for (const csprojFile of csprojFiles) {
        try {
            const content = await vscode.workspace.fs.readFile(csprojFile);
            const csprojContent = content.toString();

            // Use regex to find EmbeddedResource items with our RESX file
            const regex = new RegExp(`<EmbeddedResource\\s+Include=["'](?:[^"']*[\\\\/])?${escapeRegExp(resxFileName)}["'][^>]*>([\\s\\S]*?)</EmbeddedResource>`, 'i');
            const match = regex.exec(csprojContent);

            if (match) {
                const itemContent = match[1];
                // Look for Generator metadata within the EmbeddedResource element
                const generatorRegex = /<Generator>([^<]+)<\/Generator>/i;
                const generatorMatch = generatorRegex.exec(itemContent);

                if (generatorMatch) {
                    const generator = generatorMatch[1].trim();
                    if (generator === 'PublicResXFileCodeGenerator') {
                        return 'public';
                    } else if (generator === 'ResXFileCodeGenerator') {
                        return 'internal';
                    }
                }
            }
        } catch (error) {
            printChannelOutput(`Error reading .csproj file: ${error}`, true);
        }
    }

    return 'public'; // Default to public if no generator type is specified
}

// Helper function to escape special regex characters
function escapeRegExp(string: string): string {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export async function generateAndUpdateDesignerFile(document: vscode.TextDocument, parsedJson: any): Promise<void> {
    // Check if code generation is enabled
    const config = vscode.workspace.getConfiguration('resx-editor');
    const generateCode = config.get<boolean>('generateCode', false);

    if (generateCode) {
        // Determine the access level based on .csproj settings
        const accessLevel = await checkResxGeneratorType(document.uri.fsPath);

        // Generate and update the Designer.cs file
        const designerPath = document.uri.fsPath.replace('.resx', '.Designer.cs');
        const designerUri = vscode.Uri.file(designerPath);
        const designerCode = generateDesignerCode(document.uri.fsPath, parsedJson, accessLevel);

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