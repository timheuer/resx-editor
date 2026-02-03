import { provideVSCodeDesignSystem, vsCodeDataGrid, vsCodeDataGridCell, vsCodeDataGridRow, vsCodeButton } from '@vscode/webview-ui-toolkit';

const vscode = acquireVsCodeApi();
provideVSCodeDesignSystem().register(vsCodeDataGrid(), vsCodeDataGridRow(), vsCodeDataGridCell(), vsCodeButton());
let currentRowData = null;

// Data state
let allRowsData = []; // Source of truth

// Sorting state
let currentSortColumn = null;
let currentSortDirection = 'asc'; // 'asc' or 'desc'
let columnSortingEnabled = true; // Default to true, will be updated from config
let sortingObserver = null; // Store the MutationObserver

(function () {

    var addNewButton = document.getElementById("add-resource-button");

    addNewButton.onclick = () => {
        vscode.postMessage({
            type: 'add'
        });
    };

    const grid = document.getElementById("resource-table");
    
    // Ensure DOM is ready before initializing
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initializeWebview);
    } else {
        initializeWebview();
    }
    
    function initializeWebview() {
        initEditableDataGrid();
        sendLog('Webview initialized, ready to receive configuration');
    }

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
        if (!columnSortingEnabled) {
            return; // Don't initialize sorting if disabled
        }
        
        // Disconnect existing observer if any
        if (sortingObserver) {
            sortingObserver.disconnect();
        }
        
        // Use MutationObserver to watch for header creation since the grid generates them dynamically
        sortingObserver = new MutationObserver((mutations) => {
            // Only process mutations that add elements, not text changes or data updates
            const hasNewElements = mutations.some(mutation => 
                mutation.type === 'childList' && mutation.addedNodes.length > 0
            );
            if (hasNewElements && columnSortingEnabled) {
                attachHeaderSorting();
            }
        });
        
        // Only observe direct children to avoid triggering on data updates
        sortingObserver.observe(grid, { childList: true, subtree: false });
        
        // Try to attach immediately in case headers already exist
        attachHeaderSorting();
    }
    
    function attachHeaderSorting() {
        if (!columnSortingEnabled) {
            return; // Don't attach sorting if disabled
        }
        
        const headerCells = grid.querySelectorAll('[role="columnheader"]');
        headerCells.forEach((header, index) => {
            // Only attach if not already attached
            if (!header.hasAttribute('data-sort-attached')) {
                header.setAttribute('data-sort-attached', 'true');
                header.style.cursor = 'pointer';
                header.style.userSelect = 'none';
                header.style.position = 'relative';
                header.style.paddingRight = '20px'; // Make room for sort indicator
                
                // Add visual indicator area
                if (!header.querySelector('.sort-indicator')) {
                    const indicator = document.createElement('span');
                    indicator.className = 'sort-indicator';
                    indicator.style.marginLeft = '5px';
                    indicator.style.fontSize = '12px';
                    indicator.style.fontWeight = 'bold';
                    indicator.style.color = 'var(--vscode-foreground)';
                    indicator.style.display = 'inline-block';
                    indicator.style.minWidth = '12px';
                    indicator.style.textAlign = 'center';
                    indicator.style.lineHeight = '1';
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
        
        // Update indicators after attaching to show initial state
        updateSortIndicators();
    }

    function getColumnKeyFromHeader(header, index) {
        // Map header index to column key based on typical grid structure
        const columnKeys = ['Key', 'Value', 'Comment'];
        return columnKeys[index] || null;
    }
    
    function enableColumnSorting() {
        columnSortingEnabled = true;
        initColumnSorting();
        // Update visual indicators to show they're available
        updateSortIndicators();
    }
    
    function disableColumnSorting() {
        columnSortingEnabled = false;
        
        // Disconnect the mutation observer to stop watching for new headers
        if (sortingObserver) {
            sortingObserver.disconnect();
            sortingObserver = null;
        }
        
        // Clear sorting state
        currentSortColumn = null;
        currentSortDirection = 'asc';
        
        // Remove sorting functionality from headers
        const headerCells = grid.querySelectorAll('[role="columnheader"]');
        headerCells.forEach(header => {
            // Reset all styling
            header.style.cursor = 'default';
            header.style.paddingRight = '';
            header.style.userSelect = '';
            header.style.position = '';
            
            // Remove sort indicator completely
            const indicator = header.querySelector('.sort-indicator');
            if (indicator) {
                indicator.remove();
            }
            
            // Remove the data attribute
            header.removeAttribute('data-sort-attached');
            
            // Create a new element to replace the header without event listeners
            const newHeader = header.cloneNode(true);
            
            // Ensure the new header has no sort-related attributes or styling
            newHeader.style.cursor = 'default';
            newHeader.style.paddingRight = '';
            newHeader.style.userSelect = '';
            newHeader.style.position = '';
            newHeader.removeAttribute('data-sort-attached');
            
            // Remove any remaining sort indicators in the cloned element
            const clonedIndicator = newHeader.querySelector('.sort-indicator');
            if (clonedIndicator) {
                clonedIndicator.remove();
            }
            
            // Replace the element
            if (header.parentNode) {
                header.parentNode.replaceChild(newHeader, header);
            }
        });
        
        sendLog('Column sorting disabled - all indicators and functionality removed');
        
        // Force a refresh of the grid to ensure all changes take effect
        if (allRowsData.length > 0) {
            renderGrid();
        }
    }
    
    function sortByColumn(columnKey) {
        if (!columnSortingEnabled || allRowsData.length === 0) {
            return;
        }

        // Determine sort direction
        if (currentSortColumn === columnKey) {
            currentSortDirection = currentSortDirection === 'asc' ? 'desc' : 'asc';
        } else {
            currentSortColumn = columnKey;
            currentSortDirection = 'asc';
        }

        renderGrid();
    }
    
    function updateSortIndicators() {
        const headerCells = grid.querySelectorAll('[role="columnheader"]');
        headerCells.forEach((header, index) => {
            const indicator = header.querySelector('.sort-indicator');
            if (indicator) {
                if (!columnSortingEnabled) {
                    // Hide indicators when sorting is disabled
                    indicator.textContent = '';
                    indicator.style.display = 'none';
                } else {
                    // Show indicators when sorting is enabled
                    indicator.style.display = 'inline-block';
                    const columnKey = getColumnKeyFromHeader(header, index);
                    if (columnKey === currentSortColumn) {
                        indicator.textContent = currentSortDirection === 'asc' ? '▲' : '▼';
                        indicator.style.opacity = '1';
                        indicator.style.color = 'var(--vscode-foreground)';
                    } else {
                        indicator.textContent = '▲';
                        indicator.style.opacity = '0.3';
                        indicator.style.color = 'var(--vscode-descriptionForeground)';
                    }
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
            case 'config':
                const enableSorting = message.enableColumnSorting;
                sendLog(`Configuration received: enableColumnSorting = ${enableSorting}, current state = ${columnSortingEnabled}`);
                if (enableSorting !== columnSortingEnabled) {
                    // Add a small delay to ensure any pending grid updates are complete
                    setTimeout(() => {
                        if (enableSorting) {
                            sendLog('Enabling column sorting');
                            enableColumnSorting();
                        } else {
                            sendLog('Disabling column sorting');
                            disableColumnSorting();
                        }
                    }, 50);
                }
                return;
            case 'delete':
                sendLog("Deleting row: " + JSON.stringify(currentRowData));
                if (currentRowData) {
                    const index = allRowsData.indexOf(currentRowData);
                    if (index > -1) {
                        allRowsData.splice(index, 1);
                        renderGrid();
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
                    const index = allRowsData.findIndex(x => x.Key === message.key);
                    if (index === -1) {
                        // eslint-disable-next-line @typescript-eslint/naming-convention
                        const newItem = { Key: message.key, Value: message.value, Comment: message.comment };
                        allRowsData.push(newItem);
                        renderGrid();
                        refreshResxData();
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
        for (var i = 0; i < allRowsData.length; i++) {
            var key = allRowsData[i].Key;
            var value = allRowsData[i].Value;
            var comment = allRowsData[i].Comment;
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
            allRowsData = [];
            renderGrid();
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
        allRowsData = resxValues;
        renderGrid();
    }

    function renderGrid() {
        let displayData = [...allRowsData];

        // Apply sort
        if (currentSortColumn && columnSortingEnabled) {
            displayData.sort((a, b) => {
                const aValue = (a[currentSortColumn] || '').toString().toLowerCase();
                const bValue = (b[currentSortColumn] || '').toString().toLowerCase();
                
                const comparison = aValue.localeCompare(bValue);
                return currentSortDirection === 'asc' ? comparison : -comparison;
            });
        }

        grid.rowsData = displayData;
        updateSortIndicators();
    }

    const state = vscode.getState();
    if (state) {
        updateContent(state.text);
    }
})();
