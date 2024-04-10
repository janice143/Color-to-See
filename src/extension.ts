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

  // let disposable = vscode.commands.registerCommand(
  //   'color-to-see.helloWorld',
  //   () => {
  //     // Create and show a new webview
  //     const panel = vscode.window.createWebviewPanel(
  //       'myWebview', // Identifies the type of the webview. Used internally
  //       'My Webview', // Title of the panel displayed to the user
  //       vscode.ViewColumn.One, // Editor column to show the new webview panel in.
  //       {
  //         enableScripts: true // Important: This allows scripts to run
  //       } // Webview options. More on these later.
  //     );

  //     // And set its HTML content
  //     panel.webview.html = provider._getHtmlForWebview(panel.webview);
  //   }
  // );

  // context.subscriptions.push(disposable);
}

// this method is called when your extension is deactivated
export function deactivate() {}
