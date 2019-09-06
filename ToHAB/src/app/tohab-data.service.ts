import { Injectable } from '@angular/core';
import { dataCells, colHeaders, rowHeaders } from './mock-data';
import { HeatMapData } from './tohab-data';
import { TouchCell } from './touch-object';
import { InteractionEvent, ToHABSwipeEvent, ToHABZoomEvent } from './interaction-event';

@Injectable({
  providedIn: 'root'
})
export class ToHABDataService {

  tableData;
  callbacks;
  dataPanelSize;
  windowSizes;

  constructor() {
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
        windowIndex: 0
      }
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

  updateDataPanelSize(dataPanelSize) {
    this.dataPanelSize = dataPanelSize;

    const n = this.tableData.rows.length, m = this.tableData.columns.length;
    let {w, h} = dataPanelSize;

    const baseSize = w * n / h <= m ?
      {w: Math.floor(w * n / h), h: n} : {w: m, h: Math.floor(h * m / w)};
    console.log(baseSize);

    this.windowSizes = [];
    w = baseSize.w;
    h = baseSize.h;
    while (true) {
      w = Math.max(1, Math.floor(w * 0.7));
      h = Math.max(1, Math.floor(h * 0.7));
      if (h <= n && w <= m) {
        this.windowSizes.push({w, h});
      }
      if (Math.max(w, h) === 1) {
        break;
      }
    }
    this.windowSizes.reverse();
    this.windowSizes.push(baseSize);
    w = baseSize.w;
    h = baseSize.h;
    while (true) {
      w = Math.min(m, Math.ceil(w / 0.7));
      h = Math.min(n, Math.ceil(h / 0.7));
      console.log(w, h);
      if (h <= n && w <= m) {
        this.windowSizes.push({w, h});
      }
      if (h === n && w === m) {
        break;
      }
    }

    console.log(this.windowSizes);
    this.tableData.window.windowIndex = this.windowSizes.length - 1;
  }

  numRowCols() {
    const { windowIndex } = this.tableData.window;
    const { w, h } = this.windowSizes[windowIndex];
    return {
      numRows: h,
      numCols: w
    };
  }

  getCursorLocation() {
    return this.tableData.cursor;
  }

  getValue(cell: TouchCell) {
    return {
      value: this.tableData.values[cell.i - 1][cell.j - 1],
      rangeMin: this.tableData.valueRange.min,
      rangeMax: this.tableData.valueRange.max
    };
  }

  onInteractionPan(cell: TouchCell) {
    const cursor = this.tableData.cursor;
    cursor.i = cell.i;
    cursor.j = cell.j;
    this.fireEvents('update-cursor', cursor);
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
  onInteractionLock(evt: InteractionEvent) {
    console.log('onInteraction' + 'Lock');
  }
  onInteractionSingleTap(cell: TouchCell) {
    this.onInteractionPan(cell);
  }
  onInteractionDoubleTap(evt: InteractionEvent) {
    console.log('onInteraction' + 'DoubleTap');
  }
  onInteractionThreeFingerSwipe(evt: InteractionEvent) {
    console.log('onInteraction' + 'ThreeFingerSwipe');
  }
  onInteractionDrag(evt: InteractionEvent) {
    console.log('onInteraction' + 'Drag');
  }
  onInteractionZoom(evt: ToHABZoomEvent) {
    const window = this.tableData.window;
    if (evt.direction === 'in') {
      window.windowIndex = Math.max(0, window.windowIndex - 1);
    } else if (evt.direction === 'out') {
      window.windowIndex = Math.min(this.windowSizes.length - 1, window.windowIndex + 1);
    }
    this.fireEvents('update-heatmap', {});
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
