import * as vscode from 'vscode';
import ColorsViewProvider from './colors-view-provider';

let config: any;

export function activate(context: vscode.ExtensionContext) {
  const provider = new ColorsViewProvider(context.extensionUri);

  config = vscode.workspace.getConfiguration('color-to-see');

  context.subscriptions.push(
    vscode.window.registerWebviewViewProvider(
      ColorsViewProvider.viewType,
      provider
    )
  );

  let disposable = vscode.commands.registerCommand(
    'color-to-see.helloWorld',
    () => {
      // Create and show a new webview
      const panel = vscode.window.createWebviewPanel(
        'myWebview', // Identifies the type of the webview. Used internally
        'My Webview', // Title of the panel displayed to the user
        vscode.ViewColumn.One, // Editor column to show the new webview panel in.
        {} // Webview options. More on these later.
      );

      // And set its HTML content
      panel.webview.html = provider._getHtmlForWebview(panel.webview);
    }
  );

  context.subscriptions.push(disposable);

  // context.subscriptions.push(
  //   vscode.commands.registerCommand('color-to-see.helloWorld', () => {
  //     if (!vscode.workspace.workspaceFolders) {
  //       vscode.window.showInformationMessage('没有打开的工作区。');
  //       return;
  //     }

  //     const workspaceFolder = vscode.workspace.workspaceFolders[0].uri.fsPath;

  //     // 遍历工作区文件
  //     fs.readdir(workspaceFolder, (err, files) => {
  //       if (err) {
  //         console.error(err);
  //         return;
  //       }

  //       files.forEach((file) => {
  //         const filePath = path.join(workspaceFolder, file);
  //         // 读取文件内容
  //         fs.readFile(filePath, 'utf8', (err, data) => {
  //           if (err) {
  //             console.error(err);
  //             return;
  //           }

  //           // 在这里实现提取颜色值的逻辑
  //           console.log(data, getColors(data));
  //         });
  //       });
  //     });
  //   })
  // );

  // context.subscriptions.push(
  //   // vscode.commands.registerCommand('_' + COMMAND_NAME, doHighlight),
  //   vscode.commands.registerTextEditorCommand(
  //     'color-to-see.helloWorld',
  //     runHighlightEditorCommand
  //   )
  // );
}

// this method is called when your extension is deactivated
export function deactivate() {}
