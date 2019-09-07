import { rowHeaders, colHeaders, dataCells } from './mock-data';

export interface IValueDomain {
  min: number;
  max: number;
}

export interface IWindow {
  i: number; j: number;
  windowIndex: number;
  windowSizes: {
    w: number,
    h: number
  }[];
}

export interface ICursor {
  i: number; j: number;
  lock: boolean;
  lockI: number; lockJ: number;
}

export class WindowCursor {
  window: IWindow;
  cursor: ICursor;
}


export class ToHABData {
  rows: string[];
  columns: string[];
  values: number[][];
  valueDomain: IValueDomain;
  windowCursor: WindowCursor;
  navigationMode: 'primary' | 'secondary';

  constructor() {
    this.rows = rowHeaders;
    this.columns = colHeaders;
    this.values = dataCells;
    this.valueDomain = {
      min: 0,
      max: 1100
    };
    this.windowCursor = {
      cursor: {
        i: 0, j: 0,
        lock: false,
        lockI: -1,
        lockJ: -1,
      },
      window: {
        i: 0,
        j: 0,
        windowIndex: 0,
        windowSizes: []
      }
    };
    this.navigationMode = 'primary';
  }

  get window() {
    return this.windowCursor.window;
  }
  set window(x: IWindow) {
    this.windowCursor.window = x;
  }

  get cursor() {
    return this.windowCursor.cursor;
  }
  set cursor(x: ICursor) {
    this.windowCursor.cursor = x;
  }
}
