# Copilot Instructions for ResX Editor

A VS Code extension that provides a visual editor for `.resx` and `.resw` resource files used in .NET applications.

## Project Overview

This extension renders RESX/RESW files in an editable data grid using VS Code's Custom Editor API and WebView UI Toolkit. Users can view, edit, add, and delete localization resources without editing raw XML.

## Architecture

```
src/
├── extension.ts          # Entry point, registers commands and custom editor provider
├── resxProvider.ts       # CustomTextEditorProvider implementation (main orchestration)
├── addNewResource.ts     # Multi-step input wizard for adding resources
├── utilities/
│   ├── constants.ts      # AppConstants (command IDs, view type, prompts)
│   ├── designerGenerator.ts  # Generates .Designer.cs files
│   ├── generateCode.ts   # Coordinates Designer.cs generation
│   ├── getNonce.ts       # CSP nonce generation for webview security
│   └── json2resx.ts      # Converts JSON back to RESX XML format
└── webview/
    └── webview.js        # WebView UI (data grid, sorting, filtering, editing)
```

### Key Components

1. **ResxProvider** (`resxProvider.ts`)
   - Implements `vscode.CustomTextEditorProvider`
   - Manages webview panels per document
   - Handles message passing between extension and webview
   - Converts RESX XML to JSON for display and back to XML for saving

2. **Webview** (`webview.js`)
   - Uses `@vscode/webview-ui-toolkit` components (`vscode-data-grid`, `vscode-button`, `vscode-text-field`)
   - Maintains `allRowsData` as source of truth
   - Implements filtering, column sorting, and inline cell editing
   - Communicates with extension via `vscode.postMessage`

3. **RESX Serialization** (`json2resx.ts`)
   - Custom XML generation using `xmlbuilder2`
   - Preserves Microsoft RESX schema and formatting to minimize diffs

## Technology Stack

- **Language**: TypeScript (extension), JavaScript (webview)
- **Build**: esbuild (dual config for Node extension + ES2020 webview)
- **UI**: VS Code WebView UI Toolkit
- **Dependencies**:
  - `resx` - Parse RESX to JSON
  - `xmlbuilder2` - Generate RESX XML
  - `@timheuer/vscode-ext-logger` - Structured logging
  - `@vscode/webview-ui-toolkit` - VS Code-styled components

## Development Workflow

### Build Commands

```bash
npm run compile    # One-time build
npm run watch      # Watch mode for development
npm run package    # Production build (minified, no sourcemaps)
```

### Run/Debug

1. Press F5 in VS Code to launch Extension Development Host
2. Open any `.resx` or `.resw` file to test the editor

### Project Structure Conventions

- Commands defined in `AppConstants` class, registered in `extension.ts` and `resxProvider.ts`
- Configuration settings in `package.json` under `contributes.configuration`
- Webview HTML generated in `_getWebviewContent()` method

## Key Conventions

### Command Registration Pattern

Commands are registered lazily in `resolveCustomTextEditor` to avoid duplicate registrations:

```typescript
if (!this.registered) {
    this.registered = true;
    let deleteCommand = vscode.commands.registerCommand(AppConstants.deleteResourceCommand, () => { ... });
    // ...
}
```

### Extension ↔ Webview Communication

Messages follow this pattern:
- **Extension → Webview**: `webviewPanel.webview.postMessage({ type: 'update' | 'config' | 'delete', ... })`
- **Webview → Extension**: `vscode.postMessage({ type: 'update' | 'log' | 'error' | 'info' | 'add', ... })`

### RESX JSON Structure

Internal JSON format for resources:

```javascript
{
  "ResourceKey": {
    "value": "Resource value text",
    "comment": "Optional comment"  // omitted if empty
  }
}
```

Grid row format:

```javascript
{ Key: "ResourceKey", Value: "Resource value text", Comment: "Optional comment" }
```

### Designer.cs Generation

When `resx-editor.generateCode` is enabled:
1. Checks `.csproj` for `Generator` metadata to determine `public` vs `internal` access
2. Preserves existing namespace and summaries from existing Designer file
3. Generates strongly-typed resource class

## Configuration Settings

| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| `resx-editor.loggingLevel` | string | `"error"` | Logging level (off, error, warn, info, debug, trace) |
| `resx-editor.generateCode` | boolean | `false` | Generate .Designer.cs files (experimental) |
| `resx-editor.enableColumnSorting` | boolean | `true` | Enable column sorting in the grid |

## Testing

Tests are in `src/test/` using Mocha + `@vscode/test-electron`.

```bash
# Tests run via VS Code Extension Test Runner
# No npm script - use VS Code's test explorer or run from extension host
```

## Known Limitations

1. **Git diff viewing**: Custom editors render both views; switch to text editor for actual diffs
2. **Bulk editing**: Re-serializes entire file on each save; first diff may show formatting changes
3. **Binary resources**: Only supports string-based resources

## Recommended Settings

Add to workspace settings for better diff experience:

```json
{
  "workbench.editorAssociations": {
    "{git}:/**/*.{resx}": "default",
    "*.resx": "timheuer.resx-editor"
  }
}
```
