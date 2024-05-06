import * as vscode from 'vscode';
import ViewProvider from './view-provider';
import { DocumentColor } from './document-color';

let config: vscode.WorkspaceConfiguration;

let instanceMap: DocumentColor[] = [];

const COMMAND_NAME = 'extension.colorToSee';
const PANEL_TITLE = 'Color To See';
const EXTENSION_NAME = 'color-to-see';

export function activate(context: vscode.ExtensionContext) {
  config = vscode.workspace.getConfiguration(EXTENSION_NAME);

  context.subscriptions.push(
    vscode.commands.registerCommand(COMMAND_NAME, () => {
      registerWebviewViewProvider(context);
    })
  );
}

const registerWebviewViewProvider = (context: vscode.ExtensionContext) => {
  const provider = new ViewProvider(context.extensionUri, config);
  instanceMap = provider.instanceMap;

  const panel = vscode.window.createWebviewPanel(
    ViewProvider.viewType, // Webview 的标识符
    PANEL_TITLE, // 面板标题
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
