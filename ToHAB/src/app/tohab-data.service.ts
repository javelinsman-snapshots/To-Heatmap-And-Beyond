import { Injectable } from '@angular/core';
import { dataCells, colHeaders, rowHeaders } from './mock-data';
import { HeatMapData } from './tohab-data';
import { TouchCell } from './touch-object';
import { InteractionEvent, ToHABSwipeEvent } from './interaction-event';

@Injectable({
  providedIn: 'root'
})
export class ToHABDataService {

  heatmapData: HeatMapData;
  callbacks;

  constructor() {
    this.callbacks = {};

    this.heatmapData = {
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

  public getHeatmapData(): HeatMapData {
    return this.heatmapData;
  }

  onInteractionPan(cell: TouchCell) {
    const cursor = this.heatmapData.cursor;
    cursor.i = cell.i;
    cursor.j = cell.j;
    this.fireEvents('update-cursor', cursor);
  }
  onInteractionSwipe(evt: ToHABSwipeEvent) {
    const cursor = this.heatmapData.cursor;
    const numRows = this.heatmapData.values.length;
    const numCols = this.heatmapData.values[0].length;
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
  onInteractionSingleTap(evt: InteractionEvent) {
    console.log('onInteraction' + 'SingleTap');
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
  onInteractionZoom(evt: InteractionEvent) {
    console.log('onInteraction' + 'Zoom');
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
