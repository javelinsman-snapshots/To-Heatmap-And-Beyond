import { Injectable } from '@angular/core';
import { TouchCell, VirtualTouchCell } from './touch-object';
import { InteractionEvent, ToHABSwipeEvent, ToHABZoomEvent, ToHABDragEvent, ToHABModeChangeEvent, ToHABLockEvent } from './interaction-event';
import { ToHABData } from './tohab-data';
import { DescriptionService } from './description.service';

@Injectable({
  providedIn: 'root'
})
export class ToHABDataService {

  tohabData: ToHABData;
  callbacks;
  dragBuffer;
  previouslyPannedCell = null;


  constructor(
    private descriptionService: DescriptionService
  ) {
    this.callbacks = {};
    this.tohabData = new ToHABData();
    this.dragBuffer = {
      dx: 0,
      dy: 0
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

  get numRowCols() {
    return this.tohabData.numRowCols.bind(this.tohabData);
  }

  get updateDataPanelSize() {
    return this.tohabData.updateDataPanelSize.bind(this.tohabData);
  }

  get getCursorLocation() {
    return this.tohabData.getCursorLocation.bind(this.tohabData);
  }

  get getValue() {
    return this.tohabData.getValue.bind(this.tohabData);
  }

  determineCellType({i, j}) {
    return i === 0 && j === 0 ? 'meta' :
      i === 0 ? 'col' :
      j === 0 ? 'row' : 'data';
  }

  movedCellIfLocked(cell: VirtualTouchCell) {
    const cursor = this.tohabData.cursor;
    const newCell = Object.assign({}, cell);
    if (cursor.lock && cursor.lockI >= 0) {
      newCell.i = cursor.lockI;
    } else if (cursor.lock && cursor.lockJ >= 0) {
      newCell.j = cursor.lockJ;
    }
    newCell.type = this.determineCellType(newCell);
    return newCell;
  }

  onInteractionPan(cell: VirtualTouchCell) {
    cell = this.movedCellIfLocked(cell);
    if (this.previouslyPannedCell &&
        cell.i === this.previouslyPannedCell.i &&
        cell.j === this.previouslyPannedCell.j) {
      return;
    }
    this.previouslyPannedCell = cell;
    this.tohabData.windowCursor.moveCursorToTouchCell(cell);
    this.fireEvents('update-cursor', this.tohabData.cursor);
    this.descriptionService.describeCell({
      cellType: cell.type,
      cellValue: this.getValue(cell),
      navigationMode: this.tohabData.navigationMode
    });
  }

  get currentTouchCell() {
    const {i, j} = this.tohabData.getCursorLocation();
    const cell = {
      i, j,
      type: this.determineCellType({i, j})
    } as VirtualTouchCell;
    return cell;
  }

  onInteractionSwipe(evt: ToHABSwipeEvent) {
    this.tohabData.windowCursor.moveCursorTo(evt.direction);
    this.fireEvents('update-cursor', this.tohabData.cursor);
    const cell = this.currentTouchCell;
    this.descriptionService.describeCell({
      cellType: cell.type,
      cellValue: this.getValue(cell),
      navigationMode: this.tohabData.navigationMode
    });
  }

  onInteractionLock(evt: ToHABLockEvent) {
    const cell = this.currentTouchCell;
    console.log('onInteraction' + 'Lock');
    if (this.tohabData.cursor.lock) {
      this.tohabData.windowCursor.unlockCursor();
      this.descriptionService.read('The cursor is unlocked.')
    } else {
      this.tohabData.windowCursor.lockCursor(cell, evt.direction);
      if (evt.direction === 'horizontal') {
        const lockI = this.tohabData.cursor.lockI;
        this.descriptionService.read(`The cursor is locked to row ${lockI}.`)
      } else {
        const lockJ = this.tohabData.cursor.lockJ;
        this.descriptionService.read(`The cursor is locked to column ${lockJ}.`)
      }
    }
  }

  onInteractionSingleTap() {
    const cell = this.currentTouchCell;
    this.descriptionService.describeCell({
      cellType: cell.type,
      cellValue: this.getValue(cell),
      navigationMode: this.tohabData.navigationMode
    });
  }

  onInteractionDoubleTap(evt: InteractionEvent) {
    console.log('onInteraction' + 'DoubleTap');
    const cell = this.currentTouchCell;
    this.descriptionService.describeCell({
      cellType: cell.type,
      cellValue: this.getValue(cell),
      navigationMode: this.tohabData.navigationMode === 'primary' ? 'secondary' : 'primary'
    });
  }

  onInteractionThreeFingerSwipe(evt: ToHABModeChangeEvent) {
    this.tohabData.navigationMode = this.tohabData.navigationMode === 'primary' ? 'secondary' : 'primary';
    this.descriptionService.describeNavigationMode({
      navigationMode: this.tohabData.navigationMode
    });
  }

  onInteractionDrag(evt: ToHABDragEvent) {
    this.dragBuffer.dx += evt.dx;
    this.dragBuffer.dy += evt.dy;
    const {cellW, cellH} = this.tohabData.cellSize;
    const {binW, binH} = this.tohabData.binSize;
    const touchCellWidth = cellW * binW;
    const touchCellHeight = cellH * binH;
    // console.log('onInteractionDrag', {cellW, cellH}, this.dragBuffer)
    if (this.dragBuffer.dx < -touchCellWidth) {
      this.tohabData.windowCursor.moveWindow('right', Math.floor(-this.dragBuffer.dx / touchCellWidth));
      this.fireEvents('update-values', {});
      this.dragBuffer.dx = 0;
      this.descriptionService.read(
        this.tohabData.descriptionOfWindow({
          row: false, col: true, numCell: false
        })
      );
    } else if (this.dragBuffer.dx > touchCellWidth) {
      this.tohabData.windowCursor.moveWindow('left', Math.floor(this.dragBuffer.dx / touchCellWidth));
      this.fireEvents('update-values', {});
      this.dragBuffer.dx = 0;
      this.descriptionService.read(
        this.tohabData.descriptionOfWindow({
          row: false, col: true, numCell: false
        })
      );
    }
    if (this.dragBuffer.dy < -touchCellHeight) {
      this.tohabData.windowCursor.moveWindow('down', Math.floor(-this.dragBuffer.dy / touchCellHeight));
      this.fireEvents('update-values', {});
      this.dragBuffer.dy = 0;
      this.descriptionService.read(
        this.tohabData.descriptionOfWindow({
          row: true, col: false, numCell: false
        })
      );
    } else if (this.dragBuffer.dy > touchCellHeight) {
      this.tohabData.windowCursor.moveWindow('up', Math.floor(this.dragBuffer.dy / touchCellHeight));
      this.fireEvents('update-values', {});
      this.dragBuffer.dy = 0;
      this.descriptionService.read(
        this.tohabData.descriptionOfWindow({
          row: true, col: false, numCell: false
        })
      );
    }
    if (evt.end) {
      this.dragBuffer = {
        dx: 0,
        dy: 0
      };
    }
  }

  onInteractionZoom(evt: ToHABZoomEvent) {
    this.tohabData.windowCursor.zoomWindow(evt.direction);
    this.fireEvents('update-heatmap', {});
    this.descriptionService.readMessages([
      'zoom ' + evt.direction,
      this.tohabData.cursor.lock ? 'The cursor is unlocked' : '',
      this.tohabData.descriptionOfWindow({
          row: true, col: true, numCell: true
      })
    ]);
    this.tohabData.windowCursor.unlockCursor();
  }

}
