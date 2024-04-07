import * as vscode from 'vscode';
import { generateMainDiv } from './views';
import { DocumentColor } from './document-color';

let instanceMap = [];

export type ColorItem = {
  start: number;
  end: number;
  color: string;
  file: string;
};

export interface ColorMapping {
  [color: string]: ColorItem[];
}

class ColorsViewProvider implements vscode.WebviewViewProvider {
  public static readonly viewType = 'color-to-see.colorsView';

  private _view?: vscode.WebviewView;

  public colorInfos: ColorItem[] = [];

  constructor(private readonly _extensionUri: vscode.Uri) {}

  public async resolveWebviewView(
    webviewView: vscode.WebviewView,
    context: vscode.WebviewViewResolveContext,
    _token: vscode.CancellationToken
  ) {
    this._view = webviewView;

    this.colorInfos = flatColorItem(await collectColorsInDocuments(this._view));

    console.log('🚀 ~ ColorsViewProvider ~ colorList:', this.colorInfos);

    webviewView.webview.options = {
      // Allow scripts in the webview
      enableScripts: true,
      localResourceRoots: [this._extensionUri]
    };

    webviewView.webview.html = this._getHtmlForWebview(webviewView.webview);

    // 接收点击事件
    webviewView.webview.onDidReceiveMessage((message) => {
      console.log(
        '🚀 ~ ColorsViewProvider ~ webviewView.webview.onDidReceiveMessage ~ message:',
        message
      );
      switch (message.command) {
        case 'gotoColor':
          console.log(22222);
          this.gotoColor(message.file, message.start, message.end);
          break;
        case 'update':
          console.log(111, 'update', message.colorInfo);
          // this.colorInfos  = flatColorItem()
          break;
      }
    });
  }

  public _getHtmlForWebview(webview: vscode.Webview) {
    // Get the local path to main script run in the webview, then convert it to a uri we can use in the webview.
    const scriptUri = webview.asWebviewUri(
      vscode.Uri.joinPath(this._extensionUri, 'src/views', 'main.js')
    );

    const styleMainUri = webview.asWebviewUri(
      vscode.Uri.joinPath(this._extensionUri, 'src/views', 'index.css')
    );

    // Use a nonce to only allow a specific script to be run.
    const nonce = getNonce();

    return `<!DOCTYPE html>
			<html lang="en">
			<head>
				<meta charset="UTF-8">

				<!--
					Use a content security policy to only allow loading styles from our extension directory,
					and only allow scripts that have a specific nonce.
					(See the 'webview-sample' extension sample for img-src content security policy examples)
				-->
				<meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'unsafe-inline'; script-src 'nonce-${nonce}';">

				<meta name="viewport" content="width=device-width, initial-scale=1.0">

				<link href="${styleMainUri}" rel="stylesheet">

				<title>颜色盘</title>
			</head>
			<body>
        ${generateMainDiv(this.colorInfos)}
				<script nonce="${nonce}" src="${scriptUri}"></script>
			</body>
			</html>`;
  }

  private gotoColor(file: string, start: number, end: number) {
    const uri = vscode.Uri.file(file);
    vscode.workspace.openTextDocument(uri).then((doc) => {
      vscode.window.showTextDocument(doc).then((editor) => {
        editor.selection = new vscode.Selection(
          editor.document.positionAt(start),
          editor.document.positionAt(end)
        );
        // new vscode.Range(
        //   editor.document.positionAt(start),
        //   editor.document.positionAt(end)
        // );
      });
    });
  }
}

function getNonce() {
  let text = '';
  const possible =
    'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  for (let i = 0; i < 32; i++) {
    text += possible.charAt(Math.floor(Math.random() * possible.length));
  }
  return text;
}

async function collectColorsInDocuments(_view: vscode.WebviewView) {
  const files = await vscode.workspace.findFiles('**/*', '**/node_modules/**');
  const colorsInfos = [];

  for (const file of files) {
    const document = await vscode.workspace.openTextDocument(file);
    colorsInfos.push(await collectColorsInDocument(_view, document));
  }
  return colorsInfos;
}

async function collectColorsInDocument(_view, document) {
  if (document) {
    const instance = await findOrCreateInstance(_view, document);
    return instance.onUpdate();
  }
}

/**
 * Finds relevant instance of the DocumentColorer or creates a new one
 *
 * @param {vscode.Webview} _view
 * @param {vscode.TextDocument} document
 * @returns {DocumentColor}
 */
async function findOrCreateInstance(_view, document) {
  if (!document) {
    return {};
  }

  const found = instanceMap.find(({ document: refDoc }) => refDoc === document);

  if (!found) {
    const instance = new DocumentColor(_view, document, {});
    instanceMap.push(instance);
  }

  return found || instanceMap[instanceMap.length - 1];
}

const flatColorItem = (colorList: ColorMapping[]) => {
  let flatData: ColorItem[] = [];

  const colorSet = new Set();

  colorList.forEach((colorMapping: ColorMapping) => {
    Object.keys(colorMapping).forEach((color: string) => {
      // 如果颜色已经有了，就不再添加
      if (colorSet.has(color)) {
        return;
      }
      colorSet.add(color);
      flatData.push(colorMapping[color][0]);
    });
  });

  return flatData;
};

export default ColorsViewProvider;
