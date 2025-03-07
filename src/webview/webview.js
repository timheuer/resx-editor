import { provideVSCodeDesignSystem, vsCodeDataGrid, vsCodeDataGridCell, vsCodeDataGridRow, vsCodeButton } from '@vscode/webview-ui-toolkit';

const vscode = acquireVsCodeApi();
provideVSCodeDesignSystem().register(vsCodeDataGrid(), vsCodeDataGridRow(), vsCodeDataGridCell(), vsCodeButton());
let currentRowData = null;

(function () {

    var addNewButton = document.getElementById("add-resource-button");

    addNewButton.onclick = () => {
        vscode.postMessage({
            type: 'add'
        });
    };

    const grid = document.getElementById("resource-table");
    initEditableDataGrid();

    function initEditableDataGrid() {
        grid.oncontextmenu = cellRightClick;
        grid?.addEventListener("cell-focused", (e) => {
            const cell = e.target;
            // Do not continue if `cell` is undefined/null or is not a grid cell
            if (!cell || cell.role !== "gridcell") {
                return;
            }
            // Do not allow data grid header cells to be editable
            if (cell.className === "column-header") {
                return;
            }

            // Note: Need named closures in order to later use removeEventListener
            // in the handleBlurClosure function
            const handleKeydownClosure = (e) => {
                handleKeydown(e, cell);
            };
            const handleClickClosure = () => {
                setCellEditable(cell);
            };
            const handleBlurClosure = () => {
                syncCellChanges(cell);
                unsetCellEditable(cell);
                // Remove the blur, keydown, and click event listener _only after_
                // the cell is no longer focused
                cell.removeEventListener("blur", handleBlurClosure);
                cell.removeEventListener("keydown", handleKeydownClosure);
                cell.removeEventListener("click", handleClickClosure);
            };

            cell.addEventListener("keydown", handleKeydownClosure);
            cell.addEventListener("click", handleClickClosure);
            cell.addEventListener("blur", handleBlurClosure);
        });
    }

    // Handle keyboard events on a given cell
    function handleKeydown(e, cell) {
        if (!cell.hasAttribute("contenteditable") || cell.getAttribute("contenteditable") === "false") {
            if (e.key === "Enter") {
                e.preventDefault();
                setCellEditable(cell);
            }
        } else {
            if (e.key === "Enter" || e.key === "Escape") {
                e.preventDefault();
                syncCellChanges(cell);
                unsetCellEditable(cell);
            }
        }
    }

    // Make a given cell editable
    function setCellEditable(cell) {
        cell.setAttribute("contenteditable", "true");
    }

    // Make a given cell non-editable
    function unsetCellEditable(cell) {
        cell.setAttribute("contenteditable", "false");
    }

    // Syncs changes made in an editable cell with the
    // underlying data structure of a vscode-data-grid
    function syncCellChanges(cell) {
        const column = cell.columnDefinition;
        const row = cell.rowData;

        if (column && row) {
            const originalValue = row[column.columnDataKey];
            const newValue = cell.innerText;

            if (originalValue !== newValue) {
                row[column.columnDataKey] = newValue;
                sendLog("Value changed...Original value: " + originalValue + "; " + "New value: " + newValue);
                refreshResxData();
            }
        }
    }

    function cellRightClick(cell) {
        const sourceElement = cell.target;
        currentRowData = sourceElement._rowData;
    }

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
            case 'delete':
                sendLog("Deleting row: " + JSON.stringify(currentRowData));
                if (currentRowData) {
                    const index = grid.rowsData.indexOf(currentRowData);
                    if (index > -1) {
                        grid.rowsData.splice(index, 1);
                        refreshResxData();
                    }
                }
                else {
                    vscode.postMessage({
                        type: 'info',
                        message: `No selected resource selected. Please select a resource to delete.`
                    });
                }
                return;
            case 'add':
                sendLog(`Adding new resource: Key: ${message.key}, Value: ${message.value}, Comment: ${message.comment}`);
                if (message.key) {
                    const index = grid.rowsData.findIndex(x => x.Key === message.key);
                    if (index === -1) {
                        if (!grid.rowsData) {
                            grid.rowsData = [];
                        }
                        // eslint-disable-next-line @typescript-eslint/naming-convention
                        grid.rowsData.push({ Key: message.key, Value: message.value, Comment: message.comment });
                        refreshResxData();
                        // Force grid to update by reassigning the rowsData
                        grid.rowsData = [...grid.rowsData];
                    }
                    else {
                        // create vscode notification
                        vscode.postMessage({
                            type: 'error',
                            message: `Key "${message.key}" already exists.`
                        });
                    }
                }
                return;
        }
    });

    function refreshResxData() {
        var obj = {};
        for (var i = 0; i < grid.rowsData.length; i++) {
            var key = grid.rowsData[i].Key;
            var value = grid.rowsData[i].Value;
            var comment = grid.rowsData[i].Comment;
            obj[key] = { value: value, comment: comment };
        }

        vscode.setState({ text: JSON.stringify(obj) });
        vscode.postMessage({
            type: 'update',
            json: JSON.stringify(obj)
        });
    }

    function sendLog(message) {
        vscode.postMessage({
            type: 'log',
            message: message
        });
    }

    function updateContent(/** @type {string} **/ text) {
        var resxValues = [];

        if (!text || text.trim() === '') {
            // Handle blank file by initializing with empty data
            grid.rowsData = resxValues;
            return;
        }

        let json;
        try {
            json = JSON.parse(text);
        }
        catch (e) {
            console.log("error parsing json:", e);
            vscode.postMessage({
                type: 'error',
                message: 'Error parsing resource file content'
            });
            return;
        }

        for (const node in json || []) {
            if (node) {
                let res = json[node];
                // eslint-disable-next-line @typescript-eslint/naming-convention
                var item = { Key: node, "Value": res.value || '', "Comment": res.comment || '' };
                resxValues.push(item);
            }
            else {
                console.log('node is undefined or null');
            }
        }

        grid.rowsData = resxValues;
    }

    const state = vscode.getState();
    if (state) {
        updateContent(state.text);
    }
})();