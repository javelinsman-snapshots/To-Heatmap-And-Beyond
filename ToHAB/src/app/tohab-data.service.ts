import { Injectable } from '@angular/core';
import { dataCells, colHeaders, rowHeaders } from './mock-data';
import { HeatMapData } from './tohab-data';
import { TouchCell } from './touch-object';
import { InteractionEvent, ToHABSwipeEvent, ToHABZoomEvent, ToHABDragEvent, ToHABModeChangeEvent, ToHABLockEvent } from './interaction-event';
import { SpeakingService } from './speaking.service';

@Injectable({
  providedIn: 'root'
})
export class ToHABDataService {

  constructor(
    private speakingService: SpeakingService
  ) {
    this.callbacks = {};

    this.tableData = {
      rows: rowHeaders,
      columns: colHeaders,
      values: dataCells,
      valueRange: {
        min: 0,
        max: 1100
      },
      cursor: {
        i: 0, j: 0,
        lock: false,
        lock_i: -1,
        lock_j: -1,
      },
      window: {
        i: 0,
        j: 0,
        windowIndex: 0,
        windowSizes: []
      },
      mode: 'primary'
    };

    this.dragBuffer = {
      dx: 0,
      dy: 0
    };

  }

  get cellSize() {
    const window = this.tableData.window;
    const currentWindow = window.windowSizes[window.windowIndex];
    const {w, h} = this.dataPanelSize;
    return {
      w: w / currentWindow.w,
      h: h / currentWindow.h
    };
  }

  get navigationMode() {
    return this.tableData.mode;
  }

  set navigationMode(s: string) {
    this.tableData.mode = s;
  }

  tableData;
  callbacks;
  dataPanelSize;
  dragBuffer;
  minimumCellSize = 30;

  previouslyPannedCell = null;

  on(eventName: string, callback) {
    if (this.callbacks[eventName]) {
      this.callbacks[eventName].push(callback);
    } else {
      this.callbacks[eventName] = [callback];
    }
  }

  fireEvents(eventName: string, event: InteractionEvent) {
    this.callbacks[eventName].forEach(callback => callback(event));
  }


  moveWindow(direction, by) {
    const window = this.tableData.window;
    const n = this.tableData.rows.length, m = this.tableData.columns.length;
    const {w, h} = window.windowSizes[window.windowIndex];

    if (direction === 'left') {
      window.j = Math.max(window.j - by, 0);
    } else if (direction === 'right') {
      window.j = Math.min(window.j + by, m - w);
    } else if (direction === 'up') {
      window.i = Math.max(window.i - by, 0);
    } else if (direction === 'down') {
      window.i = Math.min(window.j + by, n - h);
    }

    this.fireEvents('update-values', {});
  }

  updateDataPanelSize(dataPanelSize) {
    this.dataPanelSize = dataPanelSize;

    const n = this.tableData.rows.length, m = this.tableData.columns.length;
    let {w, h} = dataPanelSize;

    const baseSize = w * n / h <= m ?
      {w: Math.floor(w * n / h), h: n} : {w: m, h: Math.floor(h * m / w)};
    console.log(baseSize);

    const window = this.tableData.window;
    window.windowSizes = [];
    w = baseSize.w;
    h = baseSize.h;
    while (true) {
      w = Math.max(1, Math.floor(w * 0.7));
      h = Math.max(1, Math.floor(h * 0.7));
      if (h <= n && w <= m) {
        window.windowSizes.push({w, h});
      }
      if (Math.max(w, h) === 1) {
        break;
      }
    }
    window.windowSizes.reverse();
    window.windowSizes.push(baseSize);
    w = baseSize.w;
    h = baseSize.h;
    while (true) {
      w = Math.min(m, Math.ceil(w / 0.7));
      h = Math.min(n, Math.ceil(h / 0.7));
      console.log(w, h);
      if (h <= n && w <= m) {
        window.windowSizes.push({w, h});
      }
      if (h === n && w === m) {
        break;
      }
    }

    console.log(window.windowSizes);
    window.windowIndex = window.windowSizes.length - 1;
  }

  numRowCols() {
    const window = this.tableData.window;
    const { w, h } = window.windowSizes[window.windowIndex];
    return {
      numRows: h,
      numCols: w
    };
  }

  getCursorLocation() {
    return this.tableData.cursor;
  }

  getValue(cell: TouchCell) {
    const window = this.tableData.window;
    if (cell.type === 'data') {
      return {
        value: this.tableData.values[window.i + cell.i - 1][window.j + cell.j - 1],
        rangeMin: this.tableData.valueRange.min,
        rangeMax: this.tableData.valueRange.max
      };
    } else if (cell.type === 'row') {
      return {
        value: this.tableData.rows[cell.i - 1]
      };
    } else if (cell.type === 'col') {
      return {
        value: this.tableData.columns[cell.j - 1]
      };
    } else if (cell.type === 'meta') {
      return {
        value: 'This is a table'
      };
    }
  }
  onInteractionPan(cell: TouchCell) {
    if (cell === this.previouslyPannedCell) {
      return;
    }
    this.previouslyPannedCell = cell;
    const cursor = this.tableData.cursor;
    cursor.i = cell.i;
    cursor.j = cell.j;
    this.fireEvents('update-cursor', cursor);

    this.retrieveCellOutput(cell);

  }
  onInteractionSwipe(evt: ToHABSwipeEvent) {
    const cursor = this.tableData.cursor;
    const numRows = this.tableData.values.length;
    const numCols = this.tableData.values[0].length;
    if (evt.direction === 'left') {
      cursor.j = Math.max(0, cursor.j - 1);
    } else if (evt.direction === 'right') {
      cursor.j = Math.min(numCols - 1, cursor.j + 1);
    } else if (evt.direction === 'down') {
      cursor.i = Math.min(numRows - 1, cursor.i + 1);
    } else if (evt.direction === 'up') {
      cursor.i = Math.max(0, cursor.i - 1);
    }
    this.fireEvents('update-cursor', cursor);
  }
  onInteractionLock(evt: ToHABLockEvent) {
    console.log('onInteraction' + 'Lock');
  }
  onInteractionSingleTap(cell: TouchCell) {
    this.onInteractionPan(cell);
  }
  onInteractionDoubleTap(evt: InteractionEvent) {
    alert('double tap');
    console.log('onInteraction' + 'DoubleTap');
  }
  onInteractionThreeFingerSwipe(evt: ToHABModeChangeEvent) {
    this.navigationMode = this.navigationMode === 'primary' ? 'secondary' : 'primary';
    this.speakingService.read('Navigation mode is changed.');
  }
  onInteractionDrag(evt: ToHABDragEvent) {
    console.log(this.dragBuffer);
    this.dragBuffer.dx += evt.dx;
    this.dragBuffer.dy += evt.dy;
    const cellW = this.cellSize.w;
    const cellH = this.cellSize.h;
    if (this.dragBuffer.dx < -cellW) {
      this.moveWindow('right', Math.floor(-this.dragBuffer.dx / cellW));
      this.dragBuffer.dx = 0;
    } else if (this.dragBuffer.dx > cellW) {
      this.moveWindow('left', Math.floor(this.dragBuffer.dx / cellW));
      this.dragBuffer.dx = 0;
    }
    if (this.dragBuffer.dy < -cellH) {
      this.moveWindow('down', Math.floor(-this.dragBuffer.dy / cellH));
      this.dragBuffer.dy = 0;
    } else if (this.dragBuffer.dy > cellH) {
      this.moveWindow('up', Math.floor(this.dragBuffer.dy / cellH));
      this.dragBuffer.dy = 0;
    }
    if (evt.end) {
      this.dragBuffer = {
        dx: 0,
        dy: 0
      };
    }
  }
  onInteractionZoom(evt: ToHABZoomEvent) {
    const window = this.tableData.window;
    if (evt.direction === 'in') {
      window.windowIndex = Math.max(0, window.windowIndex - 1);
    } else if (evt.direction === 'out') {
      window.windowIndex = Math.min(window.windowSizes.length - 1, window.windowIndex + 1);
    }
    this.fireEvents('update-heatmap', {});
  }


  retrieveCellOutput(cell: TouchCell) {
    const value = this.getValue(cell).value;
    window.navigator.vibrate(1000);
    if (this.navigationMode === 'primary') {
      this.speakingService.read(value + '');
    } else {
      this.speakingService.beep(10, cell.type === 'data' ? value : 150, 150);
    }
  }


}

  /*
    {volume: 10, color: headerColor, stroke: 'rgb(88,88,88)', pitch: 220, duration: 150})
  );
  */
  /*
  private makeRect(x, y, w, h, i, j) {
    return  new TouchRectangle({
      x, y, w, h, i, j
    });
    return new TouchRectangle(
        beep, s => this.speakingService.read(s),
        x, y, w, h, beepSpec, vibrationSpec, ttsSpec
    );
  }
  */
/*
  const idx = this.touchObjects.indexOf(touchObj);
  if (this.touchingObjectIndex !== idx && this.lastTouchedTimestamp + 100 < Date.now()) {
    this.touchingObjectIndex = idx;
    this.lastTouchedTimestamp = Date.now();
    touchObj.notify();
  }
*/
