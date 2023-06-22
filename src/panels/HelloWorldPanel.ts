import * as vscode from "vscode";
import { getUri } from "../utilities/getUri";
import { getNonce } from "../utilities/getNonce";

export class HelloWorldPanel {
  public static currentPanel: HelloWorldPanel | undefined;
  private readonly _panel: vscode.WebviewPanel;
  private _disposables: vscode.Disposable[] = [];

  private constructor(panel: vscode.WebviewPanel, extensionUri: vscode.Uri) {
    this._panel = panel;
    this._panel.onDidDispose(() => this.dispose(), null, this._disposables);
    this._panel.webview.html = this._getWebviewContent(this._panel.webview, extensionUri);
  }

  public static render(extensionUri: vscode.Uri) {
    if (HelloWorldPanel.currentPanel) {
      HelloWorldPanel.currentPanel._panel.reveal(vscode.ViewColumn.One);
    } else {
      const panel = vscode.window.createWebviewPanel("hello-world", "Hello World", vscode.ViewColumn.One, {
        enableScripts: true,
        localResourceRoots: [vscode.Uri.joinPath(extensionUri, "out")]
      });

      HelloWorldPanel.currentPanel = new HelloWorldPanel(panel, extensionUri);
    }
  }

  public dispose() {
    HelloWorldPanel.currentPanel = undefined;

    this._panel.dispose();

    while (this._disposables.length) {
      const disposable = this._disposables.pop();
      if (disposable) {
        disposable.dispose();
      }
    }
  }

  private _getWebviewContent(webview: vscode.Webview, extensionUri: vscode.Uri) {
    const webviewUri = getUri(webview, extensionUri, ["out", "webview.js"]);
    const nonce = getNonce();

    function generateRandomPairs(): string {
      let output = '';
      
      for (let i = 1; i <= 100; i++) {
        const key = generateRandomString();
        const value = generateRandomString();
        const comment = generateRandomString();
    
        const row = `
          <vscode-data-grid-row>
            <vscode-data-grid-cell grid-column="1">${key}</vscode-data-grid-cell>
            <vscode-data-grid-cell grid-column="2">${value}</vscode-data-grid-cell>
            <vscode-data-grid-cell grid-column="3">${comment}</vscode-data-grid-cell>
          </vscode-data-grid-row>
        `;
    
        output += row;
      }
    
      return output;
    }

    function generateRandomString(): string {
      const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
      let result = '';
    
      for (let i = 0; i < 10; i++) {
        const randomIndex = Math.floor(Math.random() * characters.length);
        result += characters.charAt(randomIndex);
      }
    
      return result;
    }

    const generatedPairs = generateRandomPairs();

    return /*html*/ `
      <!DOCTYPE html>
      <html lang="en">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Hello World!</title>
        </head>
        <body>
          <h1>Hello World!</h1>
          <vscode-data-grid aria-label="Basic" aria-label="Sticky Header">
            <vscode-data-grid-row row-type="sticky-header">
              <vscode-data-grid-cell cell-type="columnheader" grid-column="1">Key</vscode-data-grid-cell>
              <vscode-data-grid-cell cell-type="columnheader" grid-column="2">Value</vscode-data-grid-cell>
              <vscode-data-grid-cell cell-type="columnheader" grid-column="3">Comment</vscode-data-grid-cell>
            </vscode-data-grid-row>
            ${generatedPairs}
          </vscode-data-grid>
          <script type="module" nonce="${nonce}" src="${webviewUri}"></script>
        </body>
      </html>
    `;
  }
}
