'use strict';
import { workspace, window, Range, Webview } from 'vscode';
import { findScssVars } from './strategies/scss-vars';
import { findLessVars } from './strategies/less-vars';
import { findStylVars } from './strategies/styl-vars';
import { findCssVars } from './strategies/css-vars';
import { findColorFunctionsInText } from './strategies/functions';
import { findRgbNoFn } from './strategies/rgbWithoutFunction';
import { findHslNoFn } from './strategies/hslWithoutFunction';
import { findHexARGB, findHexRGBA } from './strategies/hex';
import { findHwb } from './strategies/hwb';
import { findWords } from './strategies/words';
import { DecorationMap } from './lib/decoration-map';
import { dirname } from 'path';

const colorWordsLanguages = ['css', 'scss', 'sass', 'less', 'stylus'];

export class DocumentColor {
  /**
   * Creates an instance of DocumentColor.
   * @param {TextDocument} document
   * @param {any} viewConfig
   *
   * @memberOf DocumentColor
   */
  constructor(document, viewConfig, createInstance) {
    this.document = document;
    this.strategies = [findColorFunctionsInText, findHwb];
    // 文本是否更新了
    this.changed = false;
    // 文本是否删除了
    this.disposed = false;

    this._createInstance = createInstance;

    if (viewConfig.useARGB == true) {
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

    switch (document.languageId) {
      case 'css':
        this.strategies.push(findCssVars);
        break;
      case 'less':
        this.strategies.push(findLessVars);
        break;
      case 'stylus':
        this.strategies.push(findStylVars);
        break;
      case 'sass':
      case 'scss':
        this.strategies.push((text) =>
          findScssVars(text, {
            data: text,
            cwd: dirname(document.uri.fsPath),
            extensions: ['.scss', '.sass'],
            includePaths: viewConfig.sass.includePaths || []
          })
        );
        break;
    }

    this.initialize(viewConfig);
  }

  initialize(viewConfig) {
    this.decorations = new DecorationMap(viewConfig);

    this.listner = workspace.onDidChangeTextDocument(({ document }) => {
      //  新增的文件，如果编辑了，也要统计
      // BUGFIX: 复制过来的文件或者文件夹，如果没改动，目前无法更新
      this._createInstance(document);

      // 更新document的变更状态
      this.changed = true;
    });

    workspace.onDidDeleteFiles((event) => {
      event.files.forEach((file) => {
        if (file.fsPath === this.document.uri.fsPath) {
          this.disposed = true;
        }
      });
    });

    // 文件新增
    // workspace.onDidCreateFiles((event) => {
    //   event.files.forEach(async (file) => {

    //     const document = await vscode.workspace.openTextDocument(file);
    //     this._createInstance(document);

    //     // if (file.fsPath !== this.document.uri.fsPath) {
    //     //   console.log('🚀 ~ DocumentColor ~ event.files.forEach ~ file:', file);
    //     //   // this.new = true;
    //     //   // this.changed = true;
    //     //   this._createInstance(this.document);

    //     // }
    //   });
    // });
  }

  /**
   *
   * @param {TextDocumentChangeEvent} e
   *
   * @memberOf DocumentColor
   */
  onUpdate(document = this.document) {
    if (
      this.disposed ||
      this.document.uri.toString() !== document.uri.toString()
    ) {
      return;
    }

    const text = this.document.getText();
    const version = this.document.version.toString();

    const file = this.document.uri.fsPath; // file path
    return this.updateRange(text, version, file);
  }

  /**
   * @param {string} text
   * @param {string} version
   * @param {string} file
   *
   * @memberOf DocumentColor
   */
  async updateRange(text, version, file) {
    try {
      const result = await Promise.all(this.strategies.map((fn) => fn(text)));

      const actualVersion = this.document.version.toString();
      if (actualVersion !== version) {
        if (process.env.COLOR_HIGHLIGHT_DEBUG) {
          throw new Error('Document version already has changed');
        }

        return;
      }

      const colorRanges = groupByColor(concatAll(result));

      for (const colorInfo in colorRanges) {
        const arr = colorRanges[colorInfo];
        colorRanges[colorInfo] = arr.map((item) => ({
          ...item,
          file
        }));
      }

      if (this.disposed) {
        return false;
      }

      return colorRanges;
    } catch (error) {
      console.error(error);
    }
  }

  dispose() {
    this.disposed = true;
    this.decorations.dispose();
    this.listner.dispose();

    this.decorations = null;
    this.document = null;
    this.colors = null;
    this.listner = null;
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
