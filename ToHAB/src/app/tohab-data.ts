import { rowHeaders, colHeaders, dataCells } from './mock-data';
import { TouchCell } from './touch-object';
import { clamp } from 'src/utils';

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

  moveCursorToTouchCell({i, j}) {
    const {binW, binH} = this.root.binSize;
    Object.assign(this.cursor, {
      i: i === 0 ? 0 : this.window.i + (i - 1) * binH + 1,
      j: j === 0 ? 0 : this.window.j + (j - 1) * binW + 1
    });
  }

  moveCursorTo(direction: string) {
    const {i, j} = this.cursorToTouchIndex();
    const {numRows, numCols} = this.root.numRowCols();

    if (direction === 'left') {
      this.moveCursorToTouchCell({
        i, j: Math.max(0, j - 1)
      });
    } else if (direction === 'right') {
      this.moveCursorToTouchCell({
        i, j: Math.min(numCols, j + 1)
      });
    } else if (direction === 'down') {
      this.moveCursorToTouchCell({
        i: Math.min(numRows, i + 1), j
      });
    } else if (direction === 'up') {
      this.moveCursorToTouchCell({
        i: Math.max(0, i - 1), j
      });
    }
  }

  cursorToTouchIndex() {
    const {binW, binH} = this.root.binSize;
    return {
      i: this.cursor.i === 0 ? 0 : Math.floor((this.cursor.i - 1) / binH) - Math.floor(this.window.i / binH) + 1,
      j: this.cursor.j === 0 ? 0 : Math.floor((this.cursor.j - 1) / binW) - Math.floor(this.window.j / binW) + 1
    };

  }

  get lastValidWindowIndex() {
    const {n, m} = this.root.numCells;
    const {binW, binH} = this.root.binSize;
    const nMax = (n % binH === 0 ? n : n - n % binH + binH) - 1;
    const mMax = (m % binW === 0 ? m : m - m % binW + binW) - 1;
    const {w, h} = this.root.currentWindowSize;
    const virtualWindowW = w % binW === 0 ? w : w - w % binW + binW;
    const virtualWindowH = h % binH === 0 ? h : h - h % binH + binH;
    const lastValidWindowI = Math.max(0, nMax - virtualWindowH + 1);
    const lastValidWindowJ = Math.max(0, mMax - virtualWindowW + 1);
    return {
      lastValidWindowI, lastValidWindowJ
    }
  }

  moveWindow(direction, by) {
    console.log(`moveWindow(${direction}, ${by})`)
    const {binW, binH} = this.root.binSize;
    const {lastValidWindowI, lastValidWindowJ} = this.lastValidWindowIndex;
    if (direction === 'left') {
      this.window.j = clamp(this.window.j - by * binW, 0, lastValidWindowJ);
    } else if (direction === 'right') {
      this.window.j = clamp(this.window.j + by * binW, 0, lastValidWindowJ);
    } else if (direction === 'up') {
      this.window.i = clamp(this.window.i - by * binH, 0, lastValidWindowI);
    } else if (direction === 'down') {
      this.window.i = clamp(this.window.i + by * binH, 0, lastValidWindowI);
    }
    // console.log(this.window)
  }

  zoomWindow(direction) {
    if (direction === 'in') {
      this.window.windowIndex = Math.max(0, this.window.windowIndex - 1);
    } else if (direction === 'out') {
      this.window.windowIndex = Math.min(this.window.windowSizes.length - 1, this.window.windowIndex + 1);
    }
    const {lastValidWindowI, lastValidWindowJ} = this.lastValidWindowIndex;
    this.window.i = clamp(this.window.i, 0, lastValidWindowI);
    this.window.j = clamp(this.window.j, 0, lastValidWindowJ);

    const {w, h} = this.root.currentWindowSize;

    if (this.cursor.i > 0) {
      this.cursor.i = clamp(this.cursor.i, this.window.i + 1, this.window.i + h);
    }
    if (this.cursor.j > 0) {
      this.cursor.j = clamp(this.cursor.j, this.window.j + 1, this.window.j + w);
    }
    console.log(this.cursor);

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
    this.valueDomain = {
      min: dataCells.map(row => row.reduce((a, b) => Math.min(a, b))).reduce((a, b) => Math.min(a, b)),
      max: dataCells.map(row => row.reduce((a, b) => Math.max(a, b))).reduce((a, b) => Math.max(a, b))
    };
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
    const { w, h } = this.currentWindowSize;
    const { binW, binH } = this.binSize;
    return {
      numRows: Math.ceil(h / binH),
      numCols: Math.ceil(w / binW)
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
      console.log({window, cell, binH, binW, i, j, values});
      return {
        value: values.map(row => row.reduce((a, b) => a + b)).reduce((a, b) => a + b) / values.length / values[0].length,
        valueType: 'average',
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
