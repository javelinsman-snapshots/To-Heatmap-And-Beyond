import { Injectable } from '@angular/core';
import { dataCells, colHeaders, rowHeaders } from './mock-data';
import { HeatMapData } from './tohab-data';
import { TouchCell } from './touch-object';
import { InteractionEvent } from './interaction-event';

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
    console.log(this.callbacks);
    this.callbacks[eventName].forEach(callback => callback(event));
  }

  public getHeatmapData(): HeatMapData {
    return this.heatmapData;
  }

  onInteractionSweep(cell: TouchCell) {
    const cursor = this.heatmapData.cursor;
    cursor.i = cell.i;
    cursor.j = cell.j;
    this.fireEvents('update-cursor', cursor);
  }
  onInteractionSwipe(evt: InteractionEvent) {
  }
  onInteractionLock(evt: InteractionEvent) {
  }
  onInteractionSingleTap(evt: InteractionEvent) {
  }
  onInteractionDoubleTap(evt: InteractionEvent) {
  }
  onInteractionThreeFingerSwipe(evt: InteractionEvent) {
  }
  onInteractionDrag(evt: InteractionEvent) {
  }
  onInteractionZoom(evt: InteractionEvent) {
  }



}
