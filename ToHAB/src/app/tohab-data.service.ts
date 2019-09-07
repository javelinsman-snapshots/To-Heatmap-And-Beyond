import { Injectable } from '@angular/core';
import { dataCells, colHeaders, rowHeaders } from './mock-data';
import { TouchCell } from './touch-object';
import { InteractionEvent, ToHABSwipeEvent, ToHABZoomEvent, ToHABDragEvent, ToHABModeChangeEvent, ToHABLockEvent } from './interaction-event';
import { SpeakingService } from './speaking.service';
import { ToHABData } from './tohab-data';

@Injectable({
  providedIn: 'root'
})
export class ToHABDataService {

  tohabData: ToHABData;
  callbacks;
  dataPanelSize;
  dragBuffer;
  minimumCellSize = 30;
  previouslyPannedCell = null;


  constructor(
    private speakingService: SpeakingService
  ) {
    this.callbacks = {};
    this.tohabData = new ToHABData();
    this.dragBuffer = {
      dx: 0,
      dy: 0
    };

  }

  get numCells() {
    return {
      n: this.tohabData.rows.length,
      m: this.tohabData.columns.length
    };
  }

  get currentWindowSize() {
    const window = this.tohabData.window;
    return window.windowSizes[window.windowIndex];
  }


  get cellSize() {
    const {w, h} = this.dataPanelSize;
    return {
      cellW: w / this.currentWindowSize.w,
      cellH: h / this.currentWindowSize.h
    };
  }

  get binSize() {
    const {cellW, cellH} = this.cellSize;
    return {
      binW: Math.ceil(this.minimumCellSize / cellW),
      binH: Math.ceil(this.minimumCellSize / cellH)
    };
  }

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
    const window = this.tohabData.window;
    const {n, m} = this.numCells;
    const {w, h} = window.windowSizes[window.windowIndex];
    const {binW, binH} = this.binSize;

    if (direction === 'left' && window.j - by * binW >= 0) {
      window.j -= by * binW;
    } else if (direction === 'right' && window.j + by * binW < m) {
      window.j += by * binW;
    } else if (direction === 'up' && window.i - by * binH >= 0) {
      window.i -= by * binH;
    } else if (direction === 'down' && window.i + by * binH < n) {
      window.i += by * binH;
    }

    this.fireEvents('update-values', {});
  }

  updateDataPanelSize(dataPanelSize) {
    this.dataPanelSize = dataPanelSize;

    const {n, m} = this.numCells;
    let {w, h} = dataPanelSize;

    const baseSize = w * n / h <= m ?
      {w: Math.floor(w * n / h), h: n} : {w: m, h: Math.floor(h * m / w)};
    console.log(baseSize);

    const window = this.tohabData.window;
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
    const { n, m } = this.numCells;
    const { binW, binH } = this.binSize;
    return {
      numRows: Math.ceil(n / binH),
      numCols: Math.ceil(m / binW)
    };
  }

  indexOfBinnedCell({i, j}) {
    const {binW, binH} = this.binSize;
    return {
      i: Math.floor(i / binH),
      j: Math.floor(j / binW)
    };
  }

  getCursorLocation() {
    const cursor = this.tohabData.cursor;
    const window = this.tohabData.window;
    const binnedCursor = this.indexOfBinnedCell(cursor);
    const binnedWindowOrigin = this.indexOfBinnedCell(window);
    console.log('getcursorloc', cursor);
    console.log({cursor, binnedCursor, binnedWindowOrigin});
    return {
      i: cursor.i === 0 ? 0 : binnedCursor.i - binnedWindowOrigin.i,
      j: cursor.j === 0 ? 0 : binnedCursor.j - binnedWindowOrigin.j
    };
  }

  getValue(cell: TouchCell) {
    const window = this.tohabData.window;
    const {binW, binH} = this.binSize;
    if (cell.type === 'data') {
      const i = window.i + (cell.i - 1) * binH;
      const j = window.j + (cell.j - 1) * binW;
      const values =  this.tohabData.values.slice(i, i + binH).map(row => row.slice(j, j + binW));
      return {
        value: values.map(row => row.reduce((a, b) => a + b)).reduce((a, b) => a + b) / values.length / values[0].length,
        range: {
          i, j, w: values[0].length, h: values.length
        },
        valueDomain: {
          min: this.tohabData.valueDomain.min,
          max: this.tohabData.valueDomain.max
        }
      };
    } else if (cell.type === 'row') {
      const i = window.i + (cell.i - 1) * binH;
      const values = this.tohabData.rows.slice(i, i + binH);
      return {
        value: values.join(', '),
        range: { i, h: values.length }
      };
    } else if (cell.type === 'col') {
      const j = window.j + (cell.j - 1) * binW;
      const values = this.tohabData.columns.slice(j, j + binW);
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

  onInteractionPan(cell: TouchCell) {
    if (cell === this.previouslyPannedCell) {
      return;
    }
    this.previouslyPannedCell = cell;

    const window = this.tohabData.window;
    const {binW, binH} = this.binSize;
    const i = window.i + (cell.i - 1) * binH;
    const j = window.j + (cell.j - 1) * binW;

    console.log(cell, i, j);

    const cursor = this.tohabData.cursor;

    if (cell.type === 'meta') {
      cursor.i = 0;
      cursor.j = 0;
    } else if (cell.type === 'row') {
      cursor.i = i;
      cursor.j = 0;
    } else if (cell.type === 'col') {
      cursor.i = 0;
      cursor.j = j;
    } else {
      cursor.i = i;
      cursor.j = j;
    }

    this.fireEvents('update-cursor', cursor);
    this.retrieveCellOutput(cell);
  }

  onInteractionSwipe(evt: ToHABSwipeEvent) {
    const cursor = this.tohabData.cursor;
    const {binW, binH} = this.binSize;
    const {n, m} = this.numCells;
    if (evt.direction === 'left' && cursor.j - binW >= 0) {
      cursor.j -= binW;
    } else if (evt.direction === 'right' && cursor.j + binW < m) {
      cursor.j += binW;
    } else if (evt.direction === 'down' && cursor.i + binH < n) {
      cursor.i += binH;
    } else if (evt.direction === 'up' && cursor.i - binH >= 0) {
      cursor.i -= binW;
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
    this.tohabData.navigationMode = this.tohabData.navigationMode === 'primary' ? 'secondary' : 'primary';
    this.speakingService.read('Navigation mode is changed.');
  }

  onInteractionDrag(evt: ToHABDragEvent) {
    console.log(this.dragBuffer);
    this.dragBuffer.dx += evt.dx;
    this.dragBuffer.dy += evt.dy;
    const {cellW, cellH} = this.cellSize;
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
    const window = this.tohabData.window;
    if (evt.direction === 'in') {
      window.windowIndex = Math.max(0, window.windowIndex - 1);
    } else if (evt.direction === 'out') {
      window.windowIndex = Math.min(window.windowSizes.length - 1, window.windowIndex + 1);
    }
    const {binW, binH} = this.binSize;
    window.i -= window.i % binH;
    window.j -= window.j % binW;

    this.fireEvents('update-heatmap', {});
  }


  retrieveCellOutput(cell: TouchCell) {
    const value = this.getValue(cell).value;
    window.navigator.vibrate(1000);
    if (this.tohabData.navigationMode === 'primary') {
      this.speakingService.read(value + '');
    } else {
      this.speakingService.beep(10, cell.type === 'data' ? value as number : 150, 150);
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
