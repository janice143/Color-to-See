import { TextDocument, workspace } from 'vscode';

import { findColorFunctionsInText } from './strategies/functions';
import { findHexARGB, findHexRGBA } from './strategies/hex';
import { findHslNoFn } from './strategies/hslWithoutFunction';
import { findHwb } from './strategies/hwb';
import { findRgbNoFn } from './strategies/rgbWithoutFunction';
import { findWords } from './strategies/words';
import { ColorMapping } from './types';
import { viewConfig } from './strategies/config';

const colorWordsLanguages = ['css', 'scss', 'sass', 'less', 'stylus'];

export class DocumentColor {
  document: TextDocument;
  strategies: any[];
  changed: boolean;
  disposed: boolean;
  _createInstance: any;
  listner: import('vscode').Disposable[];

  constructor(document, createInstance) {
    this.document = document;
    this.strategies = [findColorFunctionsInText, findHwb];
    // 文本是否更新了
    this.changed = false;
    // 文本是否删除了
    this.disposed = false;

    this.listner = [];

    // 创建实例
    this._createInstance = createInstance;

    if (viewConfig.useARGB === true) {
      this.strategies.push(findHexARGB);
    } else {
      this.strategies.push(findHexRGBA);
    }

    if (
      colorWordsLanguages.indexOf(document.languageId) > -1 ||
      viewConfig.matchWords
    ) {
      this.strategies.push(findWords);
    }

    if (viewConfig.matchRgbWithNoFunction) {
      let isValid = false;

      if (viewConfig.rgbWithNoFunctionLanguages.indexOf('*') > -1) {
        isValid = true;
      }

      if (
        viewConfig.rgbWithNoFunctionLanguages.indexOf(document.languageId) > -1
      ) {
        isValid = true;
      }

      if (
        viewConfig.rgbWithNoFunctionLanguages.indexOf(
          `!${document.languageId}`
        ) > -1
      ) {
        isValid = false;
      }

      if (isValid) {
        this.strategies.push(findRgbNoFn);
      }
    }

    if (viewConfig.matchHslWithNoFunction) {
      let isValid = false;

      if (viewConfig.hslWithNoFunctionLanguages.indexOf('*') > -1) {
        isValid = true;
      }

      if (
        viewConfig.hslWithNoFunctionLanguages.indexOf(document.languageId) > -1
      ) {
        isValid = true;
      }

      if (
        viewConfig.hslWithNoFunctionLanguages.indexOf(
          `!${document.languageId}`
        ) > -1
      ) {
        isValid = false;
      }

      if (isValid) {
        this.strategies.push(findHslNoFn);
      }
    }

    this.initialize();
  }

  initialize() {
    this.listner.push(
      workspace.onDidChangeTextDocument(({ document }) => {
        // 更新document的变更状态
        this.changed = true;
      })
    );
  }

  getColorInfo(document = this.document) {
    if (
      this.disposed ||
      this.document.uri.toString() !== document.uri.toString()
    ) {
      return;
    }

    const text = this.document.getText();
    const version = this.document.version.toString();

    const file = this.document.uri.fsPath; // file path
    return this.getColorInfoHelper(text, version, file);
  }

  /**
   * @param {string} text
   * @param {string} version
   * @param {string} file
   *
   * @memberOf DocumentColor
   */
  async getColorInfoHelper(text, version, file) {
    try {
      const result = await Promise.all(this.strategies.map((fn) => fn(text)));

      const actualVersion = this.document.version.toString();
      if (actualVersion !== version) {
        if (process.env.COLOR_HIGHLIGHT_DEBUG) {
          throw new Error('Document version already has changed');
        }

        return {};
      }

      // 每个文件的颜色信息，一个颜色值对应的位置等信息
      // 可能有多个颜色，所以是列表对象
      const colorRanges: ColorMapping = groupByColor(concatAll(result));

      // 拼接file信息
      for (const colorInfo in colorRanges) {
        const arr = colorRanges[colorInfo];
        colorRanges[colorInfo] = arr.map((item) => ({
          ...item,
          file
        }));
      }

      if (this.disposed) {
        return {};
      }

      return colorRanges;
    } catch (error) {
      console.error(error);
    }
  }

  dispose() {
    this.disposed = true;
    this.listner.forEach((i) => i.dispose());

    this.document = null;
    this.listner = [];
  }
}

function groupByColor(results) {
  return results.reduce((collection, item) => {
    if (!collection[item.color]) {
      collection[item.color] = [];
    }

    collection[item.color].push(item);

    return collection;
  }, {});
}

function concatAll(arr) {
  return arr.reduce((result, item) => result.concat(item), []);
}
