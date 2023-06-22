import { provideVSCodeDesignSystem, vsCodeDataGrid, vsCodeDataGridCell, vsCodeDataGridRow } from '@vscode/webview-ui-toolkit';
const vscode = acquireVsCodeApi();
console.log("webview.js is loaded");
provideVSCodeDesignSystem().register(vsCodeDataGrid(), vsCodeDataGridRow(), vsCodeDataGridCell());

(function () {

    var table =  /** @type {HTMLElement} */ (document.getElementById("resource-table"));

    window.addEventListener('message', event => {
        const message = event.data;
        switch (message.type) {
            case 'update':
                const text = message.text;
                if (text !== vscode.getState()?.text) {
                    updateContent(text);
                }

                vscode.setState({ text });

                return;
        }
    });

    function updateContent(/** @type {string} **/ text) {
        console.log("updateContent");
        console.log(text);
        if (text) {
            var resxValues = [];

            let json;
            try {
                json = JSON.parse(text);
                console.log(json);
            }
            catch
            {
                console.log("error parsing json");
                return;
            }

            for (const node in json || []) {
                if (node) {
                    let res = json[node];
                    var item = { Key: node, "Value": res.value || '', "Comment": res.comment || '' };
                    resxValues.push(item);
                }
                else {
                    console.log('node is undefined or null');
                }
            }

            table.rowsData = resxValues;
        }
        else {
            console.log("text is null");
            return;
        }
    }

    const state = vscode.getState();
    if (state) {
        updateContent(state.text);
    }
})();