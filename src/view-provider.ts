import * as vscode from 'vscode';
import { generateMainDiv } from './views';
import { DocumentColor } from './document-color';
import { ColorItem, ColorMapping, Config, OperationType } from './types';

class ViewProvider implements vscode.WebviewViewProvider {
  public static readonly viewType = 'color-to-see.colorsView';

  private _view?: vscode.WebviewView;

  // 平铺的颜色信息
  private colorInfos: ColorItem[] = [];

  // 按照文件记录的颜色信息
  private colorMapArray: ColorMapping[] = [];

  // 文档实例
  public instanceMap: DocumentColor[] = [];

  // 插件的配置
  private config: Config;

  // 操作类型
  private type: OperationType = 'change'; // init | add | delete | change

  constructor(
    private readonly _extensionUri: vscode.Uri,
    config: vscode.WorkspaceConfiguration
  ) {
    this.config = config as Config;
  }

  public async resolveWebviewView(
    webviewView: vscode.WebviewView,
    _,
    _token: vscode.CancellationToken
  ) {
    this._view = webviewView;

    webviewView.webview.options = {
      // Allow scripts in the webview
      enableScripts: true,
      localResourceRoots: [this._extensionUri]
    };

    this.updateType('init');
    this.doUpdateWebView();

    // 接收点击事件
    webviewView.webview.onDidReceiveMessage((message) => {
      switch (message.command) {
        case 'gotoColor':
          showColorTextDocument(message.file, message.start, message.end);
          break;
        case 'refresh':
          this.doUpdateWebView().finally(() => {
            webviewView.webview.postMessage({
              command: 'refreshEnd'
            });
          });

          break;
      }
    });

    // 文件新增
    vscode.workspace.onDidCreateFiles(() => {
      this.updateType('add');
    });

    // 文件删除
    vscode.workspace.onDidDeleteFiles((event) => {
      this.updateType('delete');
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

  private async doUpdateWebView() {
    try {
      if (
        this.type === 'init' ||
        this.type === 'add' ||
        this.type === 'delete'
      ) {
        await this.initDataView();
        return Promise.resolve();
      }

      // 颜色变更： text change

      // 收集变更的document，局部更新颜色视图
      for (let index = 0; index < this.instanceMap.length; index++) {
        const instance = this.instanceMap[index];

        // 如果页面更改了
        if (instance.changed) {
          const colorDocumentItem = await instance.getColorInfo();
          this.colorMapArray[index] = colorDocumentItem;
          // 恢复
          instance.changed = false;
        }
      }

      // 更新颜色信息
      this.colorInfos = updateColorInfosByMap(this.colorMapArray);

      // 更新视图
      this._view.webview.html = this._getHtmlForWebview(this._view.webview);
      return Promise.resolve();
    } catch {
      return Promise.reject();
    }
  }

  private async initDataView() {
    this.instanceMap = [];
    this.colorMapArray = await this.collectColorsInDocuments();
    this.colorInfos = updateColorInfosByMap(this.colorMapArray);
    // webviewView.webview.html = this._getHtmlForWebview(webviewView.webview);
    this._view.webview.html = this._getHtmlForWebview(this._view.webview);
  }

  private async collectColorsInDocuments() {
    const files = await findFilesUsingConfig(this.config);
    const colorsInfos: ColorMapping[] = [];
    for (const file of files) {
      try {
        const document = await vscode.workspace.openTextDocument(file);
        const instance = await this.findOrCreateInstance(document);

        colorsInfos.push(await instance.getColorInfo());
      } catch {
        continue;
      }
    }
    return colorsInfos;
  }

  public async findOrCreateInstance(document: vscode.TextDocument) {
    if (!document) {
      return {} as DocumentColor;
    }

    const found = this.instanceMap.find(
      ({ document: refDoc }) => refDoc === document
    );

    if (!found) {
      const instance = new DocumentColor(document, this.updateType.bind(this));

      this.instanceMap.push(instance);
    }

    return found || this.instanceMap[this.instanceMap.length - 1];
  }
  private updateType(v: OperationType) {
    this.type = v;
  }
}

export default ViewProvider;

const getNonce = () => {
  let text = '';
  const possible =
    'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  for (let i = 0; i < 32; i++) {
    text += possible.charAt(Math.floor(Math.random() * possible.length));
  }
  return text;
};

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

/** 根据颜色信息，打开对应的文档，并选中颜色位置 */
const showColorTextDocument = (file: string, start: number, end: number) => {
  const uri = vscode.Uri.file(file);
  vscode.workspace.openTextDocument(uri).then((doc) => {
    vscode.window.showTextDocument(doc).then((editor) => {
      editor.selection = new vscode.Selection(
        editor.document.positionAt(start),
        editor.document.positionAt(end)
      );
    });
  });
};

const findFilesUsingConfig = async (config: Config) => {
  const { include, exclude } = config.findFilesRules;
  const includePattern = `{${include.join(',')}}`;
  const excludePattern = `{${exclude.join(',')}}`;

  try {
    const files = await vscode.workspace.findFiles(
      includePattern,
      excludePattern
    );
    return files;
  } catch {
    return [];
  }
};

const updateColorInfosByMap = (colorMapArray: ColorMapping[]) => {
  return flatColorItem(colorMapArray);
};
