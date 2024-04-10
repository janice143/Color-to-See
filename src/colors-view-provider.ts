import * as vscode from 'vscode';
import { generateMainDiv } from './views';
import { DocumentColor } from './document-color';

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

  // 平铺的颜色信息
  public colorInfos: ColorItem[] = [];

  // 按照文件记录的颜色信息
  public colorMapArray: ColorMapping[] = [];
  private instanceMap = [];

  constructor(private readonly _extensionUri: vscode.Uri) {}

  public async resolveWebviewView(
    webviewView: vscode.WebviewView,
    context: vscode.WebviewViewResolveContext,
    _token: vscode.CancellationToken
  ) {
    this._view = webviewView;

    this.colorMapArray = await this.collectColorsInDocuments();

    this.updateColorInfosByMap();

    webviewView.webview.options = {
      // Allow scripts in the webview
      enableScripts: true,
      localResourceRoots: [this._extensionUri]
    };

    webviewView.webview.html = this._getHtmlForWebview(webviewView.webview);

    // 接收点击事件
    webviewView.webview.onDidReceiveMessage((message) => {
      switch (message.command) {
        case 'gotoColor':
          this.gotoColor(message.file, message.start, message.end);
          break;
        case 'refresh':
          this.doUpdateColorInfos().finally(() => {
            webviewView.webview.postMessage({
              command: 'refreshEnd'
            });
          });

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
				<meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'unsafe-inline' vscode-resource:; script-src 'nonce-${nonce}';">

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
      });
    });
  }

  private updateColorInfosByMap() {
    this.colorInfos = flatColorItem(this.colorMapArray);
  }

  private async doUpdateColorInfos() {
    try {
      // 收集变更的document，局部更新颜色视图
      for (let index = 0; index < this.instanceMap.length; index++) {
        const instance = this.instanceMap[index];

        if (instance.disposed) {
          // 删除对应的map
          this.instanceMap.splice(index, 1);
          this.colorMapArray.splice(index, 1);
          continue;
        }

        if (instance.changed) {
          const colorDocumentItem = await instance.onUpdate();
          this.colorMapArray[index] = colorDocumentItem;
          // 恢复
          instance.changed = false;
        }
      }

      this.updateColorInfosByMap();

      // 更新视图
      this._view.webview.html = this._getHtmlForWebview(this._view.webview);
      return Promise.resolve();
    } catch {
      return Promise.reject();
    }
  }

  private async collectColorsInDocuments() {
    const files = await vscode.workspace.findFiles(
      '**/*',
      '{**/node_modules/**,src/**/*}'
    );
    const colorsInfos = [];

    for (const file of files) {
      const document = await vscode.workspace.openTextDocument(file);
      colorsInfos.push(await this.collectColorsInDocument(document));
    }

    return colorsInfos;
  }

  private async collectColorsInDocument(document) {
    if (document) {
      const instance = await this.findOrCreateInstance(document);
      return instance.onUpdate();
    }
  }

  /**
   * Finds relevant instance of the DocumentColorer or creates a new one
   *
   * @param {vscode.TextDocument} document
   * @returns {DocumentColor}
   */
  public async findOrCreateInstance(document) {
    if (!document) {
      return {};
    }

    const found = this.instanceMap.find(
      ({ document: refDoc }) => refDoc === document
    );

    if (!found) {
      const instance = new DocumentColor(
        document,
        {},
        this.findOrCreateInstance.bind(this)
      );

      this.instanceMap.push(instance);
    }

    return found || this.instanceMap[this.instanceMap.length - 1];
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
