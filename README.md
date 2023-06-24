[![VS Marketplace Badge](https://img.shields.io/visual-studio-marketplace/v/timheuer.resx-editor?label=VS%20Code%20Marketplace&color=brightgreen&logo=visualstudiocode)](https://marketplace.visualstudio.com/items?itemName=TimHeuer.resx-editor)

# RESX Editor

This is a previewer/light-weight editor for string-based RESX/RESW files commonly used for localization for .NET applications. As with most of my projects this started as a learning experiment and thus is not feature rich. But it is MIT licensed, so please, by all means contribute!

## Features

Pretty simple really, if you open a .resx/.resw file from your workspace, you have the option of using this by default for the viewer and it will show the contents in a data grid format:

![2023-06-22_13-55-08](https://github.com/timheuer/resx-editor/assets/4821/8aa91777-27c9-418f-bab4-5acb1ff5ef8f)

To edit, simple click in a cell and start typing.  This will 'dirty' the file and you'll have to save (doesn't auto-persist).

### Editing note
Right now this is a bulk edit -- meaning it will re-serialize the data in/out of JSON/RESX format for this editor.  Tracking issue [#1](https://github.com/timheuer/resx-editor/issues/1) for improvements here, but as of now 'works on my machine' applies.  The serialization also probably will not match your line endings/spacing so a first diff might be more red/green than expected.  If that doesn't work, help fix or just probably not use this.

### VS Code Git diff viewing
Because this is a custom editor, if it is set as default, when viewing a diff it will render both editor views and you won't be able to see the actual diff.  You'll want to switch to the Text Editor to see it.  This is a known limitation of the VS Code custom editor extensbility points [microsoft/vscode#138525](https://github.com/microsoft/vscode/issues/138525) right now.  Maybe there is a better way of doing this even in this mode, if you can think of one, please contribute to [#3](https://github.com/timheuer/resx-editor/issues/3).  

### Disabling the editor
To disable this right click on a `resx` or `resw` file and choose `Open with...` and change options:
![image](https://github.com/timheuer/resx-editor/assets/4821/9c944bcb-4b44-4147-be75-fa5fbbb7e686)

## Credit
This is not an original idea of course.  ResX/ResW/XML editors exist.  None of them use the VS Code WebView UI toolkit and why I did this one.  Again, selfish reasons, and a learning point.  There are a few others out there that are similar and inspiration was absolutely from those.  Also the editing was contributed by @worksofliam as we wait to see if the `vscode-data-grid` itself can get default edibility.
