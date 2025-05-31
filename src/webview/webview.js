import { provideVSCodeDesignSystem, vsCodeDataGrid, vsCodeDataGridCell, vsCodeDataGridRow, vsCodeButton } from '@vscode/webview-ui-toolkit';

const vscode = acquireVsCodeApi();
provideVSCodeDesignSystem().register(vsCodeDataGrid(), vsCodeDataGridRow(), vsCodeDataGridCell(), vsCodeButton());
let currentRowData = null;

// Sorting state
let currentSortColumn = null;
let currentSortDirection = 'asc'; // 'asc' or 'desc'

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

        // Add sorting functionality to column headers
        initColumnSorting();
    }

    function initColumnSorting() {
        // Use MutationObserver to watch for header creation since the grid generates them dynamically
        const observer = new MutationObserver(() => {
            attachHeaderSorting();
        });
        
        observer.observe(grid, { childList: true, subtree: true });
        
        // Try to attach immediately in case headers already exist
        setTimeout(() => attachHeaderSorting(), 100);
    }

    function attachHeaderSorting() {
        const headerCells = grid.querySelectorAll('[role="columnheader"]');
        headerCells.forEach((header, index) => {
            // Only attach if not already attached
            if (!header.hasAttribute('data-sort-attached')) {
                header.setAttribute('data-sort-attached', 'true');
                header.style.cursor = 'pointer';
                header.style.userSelect = 'none';
                
                // Add visual indicator area
                if (!header.querySelector('.sort-indicator')) {
                    const indicator = document.createElement('span');
                    indicator.className = 'sort-indicator';
                    indicator.style.marginLeft = '5px';
                    indicator.style.fontSize = '12px';
                    header.appendChild(indicator);
                }

                header.addEventListener('click', (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    
                    // Blur any currently focused editable cells to ensure changes are saved
                    const editableCell = grid.querySelector('[contenteditable="true"]');
                    if (editableCell) {
                        editableCell.blur();
                    }
                    
                    const columnKey = getColumnKeyFromHeader(header, index);
                    if (columnKey) {
                        sortByColumn(columnKey);
                    }
                });
            }
        });
    }

    function getColumnKeyFromHeader(header, index) {
        // Map header index to column key based on typical grid structure
        const columnKeys = ['Key', 'Value', 'Comment'];
        return columnKeys[index] || null;
    }

    function sortByColumn(columnKey) {
        if (!grid.rowsData || grid.rowsData.length === 0) {
            return;
        }

        // Determine sort direction
        if (currentSortColumn === columnKey) {
            currentSortDirection = currentSortDirection === 'asc' ? 'desc' : 'asc';
        } else {
            currentSortColumn = columnKey;
            currentSortDirection = 'asc';
        }

        // Sort the data
        const sortedData = [...grid.rowsData].sort((a, b) => {
            const aValue = (a[columnKey] || '').toString().toLowerCase();
            const bValue = (b[columnKey] || '').toString().toLowerCase();
            
            const comparison = aValue.localeCompare(bValue);
            return currentSortDirection === 'asc' ? comparison : -comparison;
        });

        // Update grid data
        grid.rowsData = sortedData;
        
        // Update visual indicators
        updateSortIndicators();
        
        // Refresh the resx data to maintain data integrity
        refreshResxData();
    }

    function updateSortIndicators() {
        const headerCells = grid.querySelectorAll('[role="columnheader"]');
        headerCells.forEach((header, index) => {
            const indicator = header.querySelector('.sort-indicator');
            if (indicator) {
                const columnKey = getColumnKeyFromHeader(header, index);
                if (columnKey === currentSortColumn) {
                    indicator.textContent = currentSortDirection === 'asc' ? '▲' : '▼';
                    indicator.style.opacity = '1';
                } else {
                    indicator.textContent = '';
                    indicator.style.opacity = '0.3';
                }
            }
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
                        
                        // Apply current sorting if any
                        if (currentSortColumn) {
                            sortByColumn(currentSortColumn);
                        } else {
                            refreshResxData();
                        }
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
                        
                        // Apply current sorting if any
                        if (currentSortColumn) {
                            sortByColumn(currentSortColumn);
                        } else {
                            refreshResxData();
                            // Force grid to update by reassigning the rowsData
                            grid.rowsData = [...grid.rowsData];
                        }
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
        
        // Apply current sorting if any
        if (currentSortColumn) {
            sortByColumn(currentSortColumn);
        } else {
            // Ensure sort indicators are updated even without sorting
            setTimeout(() => updateSortIndicators(), 100);
        }
    }

    const state = vscode.getState();
    if (state) {
        updateContent(state.text);
    }
})();