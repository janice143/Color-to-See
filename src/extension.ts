import * as vscode from 'vscode';
import ViewProvider from './view-provider';

let config: vscode.WorkspaceConfiguration;

export function activate(context: vscode.ExtensionContext) {
  config = vscode.workspace.getConfiguration('color-to-see');
  const provider = new ViewProvider(context.extensionUri, config);

  context.subscriptions.push(
    vscode.window.registerWebviewViewProvider(ViewProvider.viewType, provider)
  );
}

// this method is called when your extension is deactivated
export function deactivate() {}
