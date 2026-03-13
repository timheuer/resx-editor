import * as vscode from 'vscode';
import * as resx from 'resx';
import { getNonce } from './utilities/getNonce';
import { newResourceInput } from './addNewResource';
import { AppConstants } from './utilities/constants';
import { generateAndUpdateDesignerFile } from './utilities/generateCode';
import { jsonToResx } from './utilities/json2resx';
import { Logger } from '@timheuer/vscode-ext-logger';
import { create } from 'xmlbuilder2';

export class ResxProvider implements vscode.CustomTextEditorProvider {

  public static register(context: vscode.ExtensionContext, logger: Logger): vscode.Disposable {
    const provider = new ResxProvider(context, logger);
    const providerRegistration = vscode.window.registerCustomEditorProvider(ResxProvider.viewType, provider);
    logger.info("ResX Editor custom editor provider registered.");
    return providerRegistration;
  }

  private static readonly viewType = AppConstants.viewTypeId;
  private registered = false;
  private currentPanel: vscode.WebviewPanel | undefined = undefined;
  private panelsByDocument = new Map<string, vscode.WebviewPanel>();

  constructor(
    private readonly context: vscode.ExtensionContext,
    private readonly logger: Logger
  ) { }

  public async resolveCustomTextEditor(
    document: vscode.TextDocument,
    webviewPanel: vscode.WebviewPanel,
    _token: vscode.CancellationToken
  ): Promise<void> {
    this.currentPanel = webviewPanel;
    this.panelsByDocument.set(document.uri.toString(), webviewPanel);
    webviewPanel.webview.options = {
      enableScripts: true,
      localResourceRoots: [vscode.Uri.joinPath(this.context.extensionUri, 'out'), vscode.Uri.joinPath(this.context.extensionUri, 'media')]
    };
    webviewPanel.webview.html = this._getWebviewContent(webviewPanel.webview);
    webviewPanel.onDidChangeViewState(e => {
      this.currentPanel = e.webviewPanel;
    });

    try {
      this.logger.info(document.uri.toString());
      if (!this.registered) {
        this.registered = true;
        let deleteCommand = vscode.commands.registerCommand(AppConstants.deleteResourceCommand, () => {

          this.currentPanel?.webview.postMessage({
            type: 'delete'
          });
        });

        let addCommand = vscode.commands.registerCommand(AppConstants.addNewResourceCommand, () => {
          // get all the inputs we need
          const inputs = newResourceInput(this.context);
          // then do something with them
          inputs.then((result) => {
            // Find the active webview panel for the current document
            const activePanel = this.getActivePanel();
            if (activePanel) {
              activePanel.webview.postMessage({
                type: 'add',
                key: result.key,
                value: result.value,
                comment: result.comment
              });
            } else {
              vscode.window.showErrorMessage('No active ResX editor found');
            }
          });
        });

        let openInTextEditorCommand = vscode.commands.registerCommand(AppConstants.openInTextEditorCommand, () => {
          this.logger.info("openInTextEditor command called");
          const activeUri = this.getActiveDocumentUri();
          if (!activeUri) {
            vscode.window.showErrorMessage('No active ResX editor found');
            return;
          }
          vscode.commands.executeCommand('workbench.action.reopenTextEditor', activeUri);
        });

        this.context.subscriptions.push(openInTextEditorCommand);
        this.context.subscriptions.push(deleteCommand);
        this.context.subscriptions.push(addCommand);
      }
    }
    catch (e) {
      console.log(e);
    }

    const logger = this.logger;

    async function updateWebview() {
      const config = vscode.workspace.getConfiguration('resx-editor');
      const enableColumnSorting = config.get<boolean>('enableColumnSorting', true);

      const text = document.getText();
      const resxJson = await resx.resx2js(text, true) as Record<string, { value: string; comment?: string; type?: string; mimetype?: string }>;

      // Augment the JSON with type/mimetype attributes from the raw XML
      try {
        const doc = create(text);
        const obj = doc.end({ format: 'object' }) as Record<string, any>;
        const dataItems: any[] = Array.isArray(obj?.root?.data)
          ? obj.root.data
          : obj?.root?.data ? [obj.root.data] : [];
        for (const d of dataItems) {
          const name = d['@name'];
          if (name && resxJson[name]) {
            if (d['@type']) { resxJson[name].type = d['@type']; }
            if (d['@mimetype']) { resxJson[name].mimetype = d['@mimetype']; }
          }
        }
      } catch (e) {
        logger.error(`Error augmenting RESX JSON with type/mimetype: ${e}`);
      }

      webviewPanel.webview.postMessage({
        type: 'update',
        text: JSON.stringify(resxJson)
      });

      webviewPanel.webview.postMessage({
        type: 'config',
        enableColumnSorting: enableColumnSorting
      });
    }

    const changeDocumentSubscription = vscode.workspace.onDidChangeTextDocument(e => {
      if (e.document.uri.toString() === document.uri.toString()) {
        updateWebview();
      }
    });

    const changeConfigurationSubscription = vscode.workspace.onDidChangeConfiguration(e => {
      if (e.affectsConfiguration('resx-editor.enableColumnSorting')) {
        const config = vscode.workspace.getConfiguration('resx-editor');
        const enableColumnSorting = config.get<boolean>('enableColumnSorting', true);

        webviewPanel.webview.postMessage({
          type: 'config',
          enableColumnSorting: enableColumnSorting
        });
      }
    });

    webviewPanel.onDidDispose(() => {
      this.panelsByDocument.delete(document.uri.toString());
      changeDocumentSubscription.dispose();
      changeConfigurationSubscription.dispose();
    });

    webviewPanel.webview.onDidReceiveMessage(e => {
      switch (e.type) {
        case 'update':
          this.updateTextDocument(document, e.json);
          return;
        case 'log':
          this.logger.info(e.message);
          return;
        case 'error':
          this.logger.error(e.message);
          vscode.window.showErrorMessage(e.message);
          return;
        case 'info':
          this.logger.info(e.message);
          vscode.window.showInformationMessage(e.message);
          return;
        case 'add':
          vscode.commands.executeCommand(AppConstants.addNewResourceCommand);
          return;

      }
    });
    updateWebview();

    // Send initial configuration after a small delay to ensure webview is ready
    setTimeout(() => {
      const config = vscode.workspace.getConfiguration('resx-editor');
      const enableColumnSorting = config.get<boolean>('enableColumnSorting', true);

      webviewPanel.webview.postMessage({
        type: 'config',
        enableColumnSorting: enableColumnSorting
      });
    }, 100);
  }

  private getActivePanel(): vscode.WebviewPanel | undefined {
    // Try to get the active tab and find the corresponding panel
    const activeTab = vscode.window.tabGroups.activeTabGroup.activeTab;
    if (activeTab && activeTab.input && typeof activeTab.input === 'object' && 'uri' in activeTab.input) {
      const activeUri = (activeTab.input as any).uri;
      if (activeUri) {
        const panel = this.panelsByDocument.get(activeUri.toString());
        if (panel) {
          return panel;
        }
      }
    }

    // Fallback to currentPanel if we can't determine the active tab
    return this.currentPanel;
  }

  private getActiveDocumentUri(): vscode.Uri | undefined {
    const activeTab = vscode.window.tabGroups.activeTabGroup.activeTab;
    if (activeTab && activeTab.input && typeof activeTab.input === 'object' && 'uri' in activeTab.input) {
      const activeUri = (activeTab.input as any).uri as vscode.Uri | undefined;
      if (activeUri) {
        return activeUri;
      }
    }

    if (this.currentPanel) {
      for (const [uri, panel] of this.panelsByDocument.entries()) {
        if (panel === this.currentPanel) {
          return vscode.Uri.parse(uri);
        }
      }
    }

    return undefined;
  }

  private async updateTextDocument(document: vscode.TextDocument, json: any) {
    try {
      const parsedJson = JSON.parse(json);
      const edit = new vscode.WorkspaceEdit();

      // Parse the current document XML to get metadata for all resources
      // (needed to restore binary resources and preserve type attributes)
      const resourceAttrs = this.parseResourceAttributes(document.getText());

      // Build the final JSON, restoring binary data from the original document
      const finalJson: Record<string, { value: string; comment?: string; type?: string; mimetype?: string }> = {};
      for (const key of Object.keys(parsedJson)) {
        const data = parsedJson[key];
        if (data._binary) {
          // Binary resource: restore full data from the original document XML
          const original = resourceAttrs[key];
          if (original?.value !== undefined) {
            finalJson[key] = {
              value: original.value,
              ...(original.comment ? { comment: original.comment } : {}),
              ...(original.type ? { type: original.type } : {}),
              ...(original.mimetype ? { mimetype: original.mimetype } : {})
            };
          }
          // If not found in original document (edge case), skip to avoid corruption
          if (!original?.value) {
            this.logger.error(`Binary resource '${key}' not found in original document; skipping to avoid data corruption`);
          }
        } else {
          // Normal editable resource: use value/comment from webview
          const entry: { value: string; comment?: string; type?: string; mimetype?: string } = { value: data.value };
          if (data.comment) { entry.comment = data.comment; }
          // Preserve type/mimetype from original document for typed string resources
          const original = resourceAttrs[key];
          if (original?.type) { entry.type = original.type; }
          if (original?.mimetype) { entry.mimetype = original.mimetype; }
          finalJson[key] = entry;
        }
      }

      // Update the RESX file
      const resxContent = await jsonToResx(finalJson);
      edit.replace(
        document.uri,
        new vscode.Range(0, 0, document.lineCount, 0),
        resxContent
      );

      const success = await vscode.workspace.applyEdit(edit);
      if (success) {
        // Generate Designer.cs file if enabled
        await generateAndUpdateDesignerFile(document, finalJson, this.logger);
        const config = vscode.workspace.getConfiguration('resx-editor');
        const generateCode = config.get<boolean>('generateCode', true);
        this.logger.info(`Successfully updated RESX${generateCode ? ' and Designer' : ''} files`);
      } else {
        this.logger.error(`Failed to apply workspace edits`);
        vscode.window.showErrorMessage('Failed to update resource files');
      }
      return success;
    } catch (error) {
      const errorMessage = `Error updating resource files: ${error instanceof Error ? error.message : String(error)}`;
      this.logger.error(errorMessage);
      vscode.window.showErrorMessage(errorMessage);
      return false;
    }
  }

  private parseResourceAttributes(docText: string): Record<string, { value?: string; comment?: string; type?: string; mimetype?: string }> {
    const result: Record<string, { value?: string; comment?: string; type?: string; mimetype?: string }> = {};
    try {
      const doc = create(docText);
      const obj = doc.end({ format: 'object' }) as Record<string, any>;
      const dataItems: any[] = Array.isArray(obj?.root?.data)
          ? obj.root.data
          : obj?.root?.data ? [obj.root.data] : [];
      for (const d of dataItems) {
        const name = d['@name'];
        if (name) {
          const entry: { value?: string; comment?: string; type?: string; mimetype?: string } = {};
          if (d['@type']) { entry.type = d['@type']; }
          if (d['@mimetype']) { entry.mimetype = d['@mimetype']; }
          if (d['value'] !== undefined) { entry.value = String(d['value']); }
          if (d['comment'] !== undefined) { entry.comment = String(d['comment']); }
          result[name] = entry;
        }
      }
    } catch (e) {
      this.logger.error(`Error parsing resource attributes: ${e}`);
    }
    return result;
  }

  private _getWebviewContent(webview: vscode.Webview) {
    const webviewUri = webview.asWebviewUri(vscode.Uri.joinPath(this.context.extensionUri, 'out', 'webview.js'));
    const nonce = getNonce();
    const codiconsUri = webview.asWebviewUri(vscode.Uri.joinPath(this.context.extensionUri, 'media', 'codicon.css'));

    return /*html*/ `
              <!DOCTYPE html>
              <html lang="en">
                <head>
                  <meta charset="UTF-8">
                  <meta name="viewport" content="width=device-width, initial-scale=1.0">
                  <meta
                    http-equiv="Content-Security-Policy"
                    content="default-src 'none'; img-src ${webview.cspSource} https:; script-src 'nonce-${nonce}'; style-src ${webview.cspSource} 'nonce-${nonce}'; style-src-elem ${webview.cspSource} 'unsafe-inline'; font-src ${webview.cspSource};"
                  />
                  <link href="${codiconsUri}" rel="stylesheet" nonce="${nonce}">
                </head>
                <body>
                  <vscode-data-grid id="resource-table" aria-label="Basic" generate-header="sticky" aria-label="Sticky Header"></vscode-data-grid>
                  <vscode-button id="add-resource-button">
                    Add New Resource
                    <span slot="start" class="codicon codicon-add"></span>
                  </vscode-button>
                  <script type="module" nonce="${nonce}" src="${webviewUri}"></script>
                </body>
              </html>
            `;
  }
}