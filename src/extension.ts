import * as vscode from 'vscode';
import ViewProvider from './view-provider';
import { DocumentColor } from './document-color';

let config: vscode.WorkspaceConfiguration;

let instanceMap: DocumentColor[] = [];

export function activate(context: vscode.ExtensionContext) {
  config = vscode.workspace.getConfiguration('color-to-see');
  const isEnabled = config.get('enable');

  if (isEnabled) {
    // 如果配置为true，显示活动栏的 Webview
    registerWebviewViewProvider(context);
  }
}

const registerWebviewViewProvider = (context: vscode.ExtensionContext) => {
  const provider = new ViewProvider(context.extensionUri, config);
  instanceMap = provider.instanceMap;

  // active bar: 这种注册方式方式是持久的，固定在活动栏的side bar上，不需要
  // context.subscriptions.push(
  //   vscode.window.registerWebviewViewProvider(ViewProvider.viewType, provider)
  // );

  const panel = vscode.window.createWebviewPanel(
    ViewProvider.viewType, // Webview 的标识符
    'My Webview', // 面板标题
    vscode.ViewColumn.One, // 面板显示在哪个编辑器列中
    { enableScripts: true } // 额外的 Webview 选项
  );

  provider.resolveWebviewView(panel as unknown as vscode.WebviewView);

  // panel.webview.html = provider._getHtmlForWebview(panel.webview);
  context.subscriptions.push(panel);
};

// this method is called when your extension is deactivated
export function deactivate() {
  instanceMap.forEach((instance) => instance.dispose());
  instanceMap = null;
}
