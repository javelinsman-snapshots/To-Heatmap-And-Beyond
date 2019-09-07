import { rowHeaders, colHeaders, dataCells } from './mock-data';
import { TouchCell } from './touch-object';

export interface WidthHeight {
  w: number;
  h: number;
}

export interface IValueDomain {
  min: number;
  max: number;
}

export interface ToHABWindow {
  i: number; j: number;
  windowIndex: number;
  windowSizes: WidthHeight[];
}

export interface ToHABCursor {
  i: number; j: number;
  lock: boolean;
  lockI: number; lockJ: number;
}

export class WindowCursor {
  window: ToHABWindow;
  cursor: ToHABCursor;
  dataPanelSize: WidthHeight;
  minimumCellSize: number;

  // cursor is 0-based with headers
  // window is 0-based without headers
  constructor(private root: ToHABData) {
    this.cursor = {
      i: 0, j: 0,
      lock: false,
      lockI: -1,
      lockJ: -1,
    };
    this.window = {
      i: 0,
      j: 0,
      windowIndex: 0,
      windowSizes: []
    };
    this.dataPanelSize = { w: -1, h: -1 };
    this.minimumCellSize = 50;
  }

  moveCursorToTouchCell(cell) {
    const {binW, binH} = this.root.binSize;
    const sheetI = this.window.i + (cell.i - 1) * binH + 1;
    const sheetJ = this.window.j + (cell.j - 1) * binW + 1;
    const cursor = this.cursor;
    if (cell.type === 'meta') {
      cursor.i = 0;
      cursor.j = 0;
    } else if (cell.type === 'row') {
      cursor.i = sheetI;
      cursor.j = 0;
    } else if (cell.type === 'col') {
      cursor.i = 0;
      cursor.j = sheetJ;
    } else {
      cursor.i = sheetI;
      cursor.j = sheetJ;
    }
  }

  moveCursorTo(direction: string) {
    const {binW, binH} = this.root.binSize;
    const {n, m} = this.root.numCells;
    if (direction === 'left' && this.cursor.j - binW >= 0) {
      this.cursor.j -= binW;
    } else if (direction === 'right' && this.cursor.j + binW < m) {
      this.cursor.j += binW;
    } else if (direction === 'down' && this.cursor.i + binH < n) {
      this.cursor.i += binH;
    } else if (direction === 'up' && this.cursor.i - binH >= 0) {
      this.cursor.i -= binW;
    }
  }

  cursorToTouchIndex() {
    const {binW, binH} = this.root.binSize;
    return {
      i: this.cursor.i === 0 ? 0 : Math.floor((this.cursor.i - 1) / binH) - Math.floor(this.window.i / binH) + 1,
      j: this.cursor.j === 0 ? 0 : Math.floor((this.cursor.j - 1) / binW) - Math.floor(this.window.j / binW) + 1
    };

  }

  moveWindow(direction, by) {
    const {n, m} = this.root.numCells;
    const {w, h} = this.root.currentWindowSize;
    const {binW, binH} = this.root.binSize;
    if (direction === 'left' && this.window.j - by * binW >= 0) {
      this.window.j -= by * binW;
    } else if (direction === 'right' && this.window.j + by * binW < m) {
      this.window.j += by * binW;
    } else if (direction === 'up' && this.window.i - by * binH >= 0) {
      this.window.i -= by * binH;
    } else if (direction === 'down' && this.window.i + by * binH < n) {
      this.window.i += by * binH;
    }
  }

  zoomWindow(direction) {
    if (direction === 'in') {
      this.window.windowIndex = Math.max(0, this.window.windowIndex - 1);
    } else if (direction === 'out') {
      this.window.windowIndex = Math.min(this.window.windowSizes.length - 1, this.window.windowIndex + 1);
    }
    const {binW, binH} = this.root.binSize;
    this.window.i -= this.window.i % binH;
    this.window.j -= this.window.j % binW;

  }

  updateDataPanelSize(dataPanelSize) {
    this.dataPanelSize = dataPanelSize;

    const {n, m} = this.root.numCells;
    let {w, h} = dataPanelSize;
    const baseSize = w * n / h <= m ?
      {w: Math.floor(w * n / h), h: n} : {w: m, h: Math.floor(h * m / w)};
    console.log(baseSize);

    this.window.windowSizes = [];
    w = baseSize.w;
    h = baseSize.h;
    while (true) {
      w = Math.max(1, Math.floor(w * 0.7));
      h = Math.max(1, Math.floor(h * 0.7));
      if (h <= n && w <= m) {
        this.window.windowSizes.push({w, h});
      }
      if (Math.max(w, h) === 1) {
        break;
      }
    }
    this.window.windowSizes.reverse();
    this.window.windowSizes.push(baseSize);
    w = baseSize.w;
    h = baseSize.h;
    while (true) {
      w = Math.min(m, Math.ceil(w / 0.7));
      h = Math.min(n, Math.ceil(h / 0.7));
      console.log(w, h);
      if (h <= n && w <= m) {
        this.window.windowSizes.push({w, h});
      }
      if (h === n && w === m) {
        break;
      }
    }
    console.log(this.window.windowSizes);
    this.window.windowIndex = this.window.windowSizes.length - 1;

  }
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
    this.valueDomain = { min: 0, max: 1100 };
    this.windowCursor = new WindowCursor(this);
    this.navigationMode = 'primary';
  }

  get window() {
    return this.windowCursor.window;
  }
  set window(x: ToHABWindow) {
    this.windowCursor.window = x;
  }

  get cursor() {
    return this.windowCursor.cursor;
  }
  set cursor(x: ToHABCursor) {
    this.windowCursor.cursor = x;
  }

  get numCells() {
    return {
      n: this.rows.length,
      m: this.columns.length
    };
  }

  get currentWindowSize() {
    return this.window.windowSizes[this.window.windowIndex];
  }

  get cellSize() {
    const {w, h} = this.windowCursor.dataPanelSize;
    return {
      cellW: w / this.currentWindowSize.w,
      cellH: h / this.currentWindowSize.h
    };
  }

  get binSize() {
    const {cellW, cellH} = this.cellSize;
    return {
      binW: Math.ceil(this.windowCursor.minimumCellSize / cellW),
      binH: Math.ceil(this.windowCursor.minimumCellSize / cellH)
    };
  }

  updateDataPanelSize(dataPanelSize) {
    this.windowCursor.updateDataPanelSize(dataPanelSize);
  }

  numRowCols() {
    const { n, m } = this.numCells;
    const { binW, binH } = this.binSize;
    return {
      numRows: Math.ceil(n / binH),
      numCols: Math.ceil(m / binW)
    };
  }

  getCursorLocation() {
    return this.windowCursor.cursorToTouchIndex();

  }

  getValue(cell: TouchCell) {
    const window = this.window;
    const {binW, binH} = this.binSize;
    if (cell.type === 'data') {
      const i = window.i + (cell.i - 1) * binH;
      const j = window.j + (cell.j - 1) * binW;
      const values =  this.values.slice(i, i + binH).map(row => row.slice(j, j + binW));
      return {
        value: values.map(row => row.reduce((a, b) => a + b)).reduce((a, b) => a + b) / values.length / values[0].length,
        range: {
          i, j, w: values[0].length, h: values.length
        },
        valueDomain: {
          min: this.valueDomain.min,
          max: this.valueDomain.max
        }
      };
    } else if (cell.type === 'row') {
      const i = window.i + (cell.i - 1) * binH;
      const values = this.rows.slice(i, i + binH);
      return {
        value: values.join(', '),
        range: { i, h: values.length }
      };
    } else if (cell.type === 'col') {
      const j = window.j + (cell.j - 1) * binW;
      const values = this.columns.slice(j, j + binW);
      return {
        value: values.join(', '),
        range: { j, w: values[0].length }
      };
    } else if (cell.type === 'meta') {
      return {
        value: 'This is a table'
      };
    }
  }

}
