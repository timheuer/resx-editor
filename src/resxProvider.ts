import * as vscode from 'vscode';
import * as resx from 'resx';
import { getNonce } from './utilities/getNonce';
import { printChannelOutput } from './extension';
import { newResourceInput } from './addNewResource';

export class ResxProvider implements vscode.CustomTextEditorProvider {

  public static register(context: vscode.ExtensionContext): vscode.Disposable {
    const provider = new ResxProvider(context);
    const providerRegistration = vscode.window.registerCustomEditorProvider(ResxProvider.viewType, provider);
    printChannelOutput("ResX Editor custom editor provider registered.", true);    
    return providerRegistration;
  }

  private static readonly viewType = 'resx-editor.editor';
  private registered = false;
  private currentPanel: vscode.WebviewPanel | undefined = undefined;
  
  constructor(
    private readonly context: vscode.ExtensionContext
  ) { }

  public async resolveCustomTextEditor(
    document: vscode.TextDocument,
    webviewPanel: vscode.WebviewPanel,
    _token: vscode.CancellationToken
  ): Promise<void> {
    this.currentPanel = webviewPanel;
    webviewPanel.webview.options = {
      enableScripts: true,
      localResourceRoots: [vscode.Uri.joinPath(this.context.extensionUri, 'out')]
    };
    webviewPanel.webview.html = this._getWebviewContent(webviewPanel.webview);

    try {
      if (!this.registered) {
        printChannelOutput("deleteResource command registered", true);
        this.registered = true;
        let deleteCommand = vscode.commands.registerCommand('resx-editor.deleteResource', () => {

          this.currentPanel?.webview.postMessage({
            type: 'delete'
          });
        });

        let addCommand = vscode.commands.registerCommand('resx-editor.addNewResource', () => {
          // get all the inputs we need
          const inputs = newResourceInput(this.context);
          // then do something with them
          inputs.then((result) => {
            printChannelOutput(`Adding new resource: Key: ${result.key}, Value: ${result.value}, Comment: ${result.comment}`, true);
            this.currentPanel?.webview.postMessage({
              type: 'add',
              key: result.key,
              value: result.value,
              comment: result.comment
            });
          });
      });

      this.context.subscriptions.push(deleteCommand);
      this.context.subscriptions.push(addCommand);
    }
  }
  catch (e)
  {
    console.log(e);
  }

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
        case 'log':
          printChannelOutput(e.message, true);
          return;
        case 'error':
          printChannelOutput(e.message, true);
          vscode.window.showErrorMessage(e.message);
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
                  <meta
                    http-equiv="Content-Security-Policy"
                    content="default-src 'none'; img-src ${webview.cspSource} https:; script-src ${webview.cspSource}; style-src ${webview.cspSource};script-src 'nonce-${nonce}';"
                  />
                </head>
                <body>
                  <vscode-data-grid id="resource-table" aria-label="Basic" generate-header="sticky" aria-label="Sticky Header"></vscode-data-grid>
                  <script type="module" nonce="${nonce}" src="${webviewUri}"></script>
                </body>
              </html>
            `;
  }
}