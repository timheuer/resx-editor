import * as path from 'path';
import * as vscode from 'vscode';
import resx from 'resx';
import { getNonce } from './utilities/getNonce';

export class ResxProvider implements vscode.CustomTextEditorProvider {

  public static register(context: vscode.ExtensionContext): vscode.Disposable {
    const provider = new ResxProvider(context);
    const providerRegistration = vscode.window.registerCustomEditorProvider(ResxProvider.viewType, provider);
    return providerRegistration;
  }

  private static readonly viewType = 'resx-editor.editor';

  constructor(
    private readonly context: vscode.ExtensionContext
  ) { }

  public async resolveCustomTextEditor(
    document: vscode.TextDocument,
    webviewPanel: vscode.WebviewPanel,
    _token: vscode.CancellationToken
  ): Promise<void> {
    webviewPanel.webview.options = {
      enableScripts: true,
      localResourceRoots: [vscode.Uri.joinPath(this.context.extensionUri, 'out')]
    };
    webviewPanel.webview.html = this._getWebviewContent(webviewPanel.webview);

    async function updateWebview() {
      webviewPanel.webview.postMessage({
        type: 'update',
        text: JSON.stringify(await resx.resx2js(document.getText(), true))
      });
    }

    const changeDocumentSubscription = vscode.workspace.onDidChangeTextDocument(e => {
      if (e.document.uri.toString() === document.uri.toString()) {
        updateWebview();
      }
    });

    webviewPanel.onDidDispose(() => {
      changeDocumentSubscription.dispose();
    });

    webviewPanel.webview.onDidReceiveMessage(e => {
      switch (e.type) {
        case 'update':
          this.updateTextDocument(document, e.json);
          return;
      }
    });

    updateWebview();
  }

  private async updateTextDocument(document: vscode.TextDocument, json: any) {

    const edit = new vscode.WorkspaceEdit();

    edit.replace(
      document.uri,
      new vscode.Range(0, 0, document.lineCount, 0),
      await resx.js2resx(JSON.parse(json)));
    return vscode.workspace.applyEdit(edit);
  }

  private _getWebviewContent(webview: vscode.Webview) {
    const webviewUri = webview.asWebviewUri(vscode.Uri.joinPath(this.context.extensionUri, 'out', 'webview.js'));
    const nonce = getNonce();

    return /*html*/ `
              <!DOCTYPE html>
              <html lang="en">
                <head>
                  <meta charset="UTF-8">
                  <meta name="viewport" content="width=device-width, initial-scale=1.0">
                </head>
                <body>
                  <vscode-data-grid id="resource-table" aria-label="Basic" generate-header="sticky" aria-label="Sticky Header"></vscode-data-grid>
                  <script type="module" nonce="${nonce}" src="${webviewUri}"></script>
                </body>
              </html>
            `;
  }
}