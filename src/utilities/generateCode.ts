import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import { generateDesignerCode } from './designerGenerator';
import { Logger } from '@timheuer/vscode-ext-logger';

async function extractExistingNamespace(designerPath: string): Promise<string | undefined> {
    try {
        const designerUri = vscode.Uri.file(designerPath);
        const content = await vscode.workspace.fs.readFile(designerUri);
        const match = content.toString().match(/namespace\s+([^\s{]+)/);
        return match?.[1];
    } catch {
        return undefined;
    }
}

async function checkResxGeneratorType(resxPath: string, logger: Logger): Promise<'public' | 'internal'> {
    const csprojFiles = await findCsprojFilesUpTree(resxPath);

    if (csprojFiles.length === 0) {
        return 'public'; // Default to public if no .csproj is found
    }

    const resxFileName = path.basename(resxPath);

    for (const csprojFile of csprojFiles) {
        try {
            const content = await vscode.workspace.fs.readFile(csprojFile);
            const csprojContent = content.toString();

            // Use regex to find EmbeddedResource items with our RESX file using either Include or Update attributes
            const regex = new RegExp(`<EmbeddedResource\\s+(?:Include|Update)=["'](?:[^"']*[\\\\/])?${escapeRegExp(resxFileName)}["'][^>]*>([\\s\\S]*?)</EmbeddedResource>`, 'i');
            const match = regex.exec(csprojContent);

            if (match) {
                const itemContent = match[1];
                // Look for Generator metadata within the EmbeddedResource element
                const generatorRegex = /<Generator>\s*([^<]+?)\s*<\/Generator>/i;
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
            logger.error(`Error reading .csproj file: ${error}`);
        }
    }

    return 'public'; // Default to public if no generator type is specified
}

async function findCsprojFilesUpTree(resxPath: string): Promise<vscode.Uri[]> {
    const resxUri = vscode.Uri.file(resxPath);
    const workspaceFolder = vscode.workspace.getWorkspaceFolder(resxUri);
    const workspaceRoot = workspaceFolder?.uri.fsPath;

    let currentDir = path.dirname(resxPath);
    const results: vscode.Uri[] = [];

    while (true) {
        const matches = await vscode.workspace.findFiles(
            new vscode.RelativePattern(currentDir, '*.csproj')
        );
        results.push(...matches);

        if (workspaceRoot && path.resolve(currentDir) === path.resolve(workspaceRoot)) {
            break;
        }

        const parentDir = path.dirname(currentDir);
        if (parentDir === currentDir) {
            break;
        }
        currentDir = parentDir;
    }

    return results;
}

// Helper function to escape special regex characters
function escapeRegExp(string: string): string {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export async function generateAndUpdateDesignerFile(document: vscode.TextDocument, parsedJson: any, logger: Logger): Promise<void> {
    // Check if code generation is enabled
    const config = vscode.workspace.getConfiguration('resx-editor');
    const generateCode = config.get<boolean>('generateCode', false);

    if (generateCode) {
        // Determine the access level based on .csproj settings
        const accessLevel = await checkResxGeneratorType(document.uri.fsPath, logger);

        // Get the existing namespace if the Designer file exists
        const designerPath = document.uri.fsPath.replace('.resx', '.Designer.cs');

        // Generate and update the Designer.cs file
        const designerUri = vscode.Uri.file(designerPath);
        const designerCode = generateDesignerCode(document.uri.fsPath, parsedJson, accessLevel);

        try {
            await vscode.workspace.fs.stat(designerUri);
            // File exists, write contents directly
            logger.info(`Updating existing Designer file at ${designerPath}`);
            await vscode.workspace.fs.writeFile(designerUri, new Uint8Array(Buffer.from(designerCode, 'utf8')));
        } catch {
            // File doesn't exist, create it
            logger.info(`Creating new Designer file at ${designerPath}`);
            await vscode.workspace.fs.writeFile(designerUri, new Uint8Array(Buffer.from(designerCode, 'utf8')));
        }
    } else {
        logger.info('Code generation is disabled, skipping Designer.cs file update');
    }
}