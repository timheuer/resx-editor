import * as vscode from 'vscode';
import * as resx from 'resx';
import { getNonce } from './utilities/getNonce';
import { printChannelOutput } from './extension';
import { newResourceInput } from './addNewResource';
import { AppConstants } from './utilities/constants';

export class ResxProvider implements vscode.CustomTextEditorProvider {

  public static register(context: vscode.ExtensionContext): vscode.Disposable {
    const provider = new ResxProvider(context);
    const providerRegistration = vscode.window.registerCustomEditorProvider(ResxProvider.viewType, provider);
    printChannelOutput("ResX Editor custom editor provider registered.", true);
    return providerRegistration;
  }

  private static readonly viewType = AppConstants.viewTypeId;
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
      localResourceRoots: [vscode.Uri.joinPath(this.context.extensionUri, 'out'), vscode.Uri.joinPath(this.context.extensionUri, 'media')]
    };
    webviewPanel.webview.html = this._getWebviewContent(webviewPanel.webview);
    webviewPanel.onDidChangeViewState(e => {
      this.currentPanel = e.webviewPanel;
    });

    try {
      printChannelOutput(document.uri.toString(), true);
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
            this.currentPanel?.webview.postMessage({
              type: 'add',
              key: result.key,
              value: result.value,
              comment: result.comment
            });
          });
        });

        let openInTextEditorCommand = vscode.commands.registerCommand(AppConstants.openInTextEditorCommand, () => {
          printChannelOutput("openInTextEditor command called", true);
          vscode.commands.executeCommand('workbench.action.reopenTextEditor', document?.uri);
        });

        this.context.subscriptions.push(openInTextEditorCommand);
        this.context.subscriptions.push(deleteCommand);
        this.context.subscriptions.push(addCommand);
      }
    }
    catch (e) {
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
        case 'info':
          printChannelOutput(e.message, true);
          vscode.window.showInformationMessage(e.message);
          return;
        case 'add':
          vscode.commands.executeCommand(AppConstants.addNewResourceCommand);
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