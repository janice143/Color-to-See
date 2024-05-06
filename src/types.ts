import { GlobPattern } from 'vscode';

export type MessageType = 'gotoColor' | 'refresh' | 'refreshEnd';

export type Message = {
  command: MessageType;
};

export interface GoToColorMessage extends Message {
  command: 'gotoColor';
  file: string;
  start: number;
  end: number;
}
export interface RefreshMessage extends Message {
  command: 'refresh';
}

export type ColorItem = {
  /** 颜色值起始位置 */
  start: number;
  /** 颜色值结束位置 */
  end: number;
  /** 颜色值 */
  color: string;
  /** 颜色值所在的文件路径 */
  file: string;
};

export interface ColorMapping {
  [color: string]: ColorItem[];
}

export interface Config {
  findFilesRules?: {
    include?: GlobPattern[];
    exclude?: GlobPattern[];
  };
  enable?: boolean;
}

export type OperationType = 'init' | 'add' | 'delete' | 'change';
