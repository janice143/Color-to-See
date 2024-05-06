import * as vscode from 'vscode';
import ViewProvider from './view-provider';
import { DocumentColor } from './document-color';

let config: vscode.WorkspaceConfiguration;

let instanceMap: DocumentColor[] = [];

export function activate(context: vscode.ExtensionContext) {
  config = vscode.workspace.getConfiguration('color-to-see');
  console.log('🚀 ~ activate ~ config:', config);
  const isEnabled = config.get('enable');

  if (isEnabled) {
    // 如果配置为true，显示活动栏的 Webview
    registerWebviewViewProvider(context);
  }
}

const registerWebviewViewProvider = (context: vscode.ExtensionContext) => {
  const provider = new ViewProvider(context.extensionUri, config);
  instanceMap = provider.instanceMap;

  context.subscriptions.push(
    vscode.window.registerWebviewViewProvider(ViewProvider.viewType, provider)
  );
};

// this method is called when your extension is deactivated
export function deactivate() {
  instanceMap.forEach((instance) => instance.dispose());
  instanceMap = null;
}
