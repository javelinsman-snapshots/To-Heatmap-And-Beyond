import { Component, OnInit, Input, Output, EventEmitter, AfterViewInit } from '@angular/core';
import { ToHABDataService } from '../tohab-data.service';
import { TouchCell } from '../touch-object';
import * as d3 from 'd3';
import { InteractionManagerService } from '../interaction-manager.service';

@Component({
  selector: 'app-touch-canvas',
  templateUrl: './touch-canvas.component.html',
  styleUrls: ['./touch-canvas.component.scss']
})
export class TouchCanvasComponent implements OnInit, AfterViewInit {

  constructor(
    private tohabDataService: ToHABDataService,
    private interactionManagerService: InteractionManagerService
  ) {}

  private touchCells: TouchCell[];

  canvas: any;
  headerSize: number;
  dataPanelSize: any;

  public makeTouchCells() {
    this.touchCells = [];
    const { numRows, numCols } = this.tohabDataService.numRowCols();

    const transformCoordinate = ( x: number, y: number, range = { x: [0, 100], y: [0, 100] }) => {
      const x_ = ((x - range.x[0]) / (range.x[1] - range.x[0])) * this.dataPanelSize.w;
      const y_ = ((y - range.y[0]) / (range.y[1] - range.y[0])) * this.dataPanelSize.h;
      return { x: x_, y: y_ };
    };

    for (let i = 0; i <= numRows; i++) {
      for (let j = 0; j <= numCols; j++) {
        const cellWidth = 100 / numCols;
        const cellHeight = 100 / numRows;
        if (i === 0 && j === 0) {
          this.touchCells.push(
            new TouchCell({ type: 'meta', x: 0, y: 0, w: this.headerSize, h: this.headerSize, i, j })
          );
        } else if (i === 0) {
          const p = transformCoordinate(cellWidth * (j - 1), 0);
          const p_ = transformCoordinate(cellWidth * (j + 0), 0);
          this.touchCells.push(
            new TouchCell({ type: 'col', x: this.headerSize + p.x, y: 0, w: p_.x - p.x, h: this.headerSize, i, j })
          );
        } else if (j === 0) {
          const p = transformCoordinate(0 , cellHeight * (i - 1));
          const p_ = transformCoordinate(0, cellHeight * (i + 0));
          this.touchCells.push(
            new TouchCell({ type: 'row', x: 0, y: this.headerSize + p.y, w: this.headerSize, h: p_.y - p.y, i, j })
          );
        } else {
          const p = transformCoordinate(cellWidth * (j - 1), cellHeight * (i - 1));
          const p_ = transformCoordinate(cellWidth * (j + 0), cellHeight * (i + 0));
          this.touchCells.push(
            new TouchCell({ type: 'data', x: this.headerSize + p.x, y: this.headerSize + p.y,
              w: p_.x - p.x, h: p_.y - p.y, i, j })
          );
        }
      }
    }
  }

  ngOnInit() {
    const canvasElement = document.getElementsByTagName('canvas')[0];
    this.interactionManagerService.bindElement(canvasElement);

    this.interactionManagerService.on('pan', this.onPan.bind(this));
    this.interactionManagerService.on('single-tap', this.onSingleTap.bind(this));
    this.tohabDataService.on('update-heatmap', this.updateHeatmap.bind(this));
    this.tohabDataService.on('update-cursor', this.updateCursor.bind(this));
    this.tohabDataService.on('update-values', this.updateValues.bind(this));
  }

  ngAfterViewInit() {
    this.canvas = d3.select('svg');
    const width = window.innerWidth * 0.98;
    const height = window.innerHeight * 0.98;
    this.headerSize = 50;
    this.canvas.attr('width', width).attr('height', height);
    this.dataPanelSize = {
      w: width - this.headerSize,
      h: height - this.headerSize
    };
    this.tohabDataService.updateDataPanelSize(this.dataPanelSize);
    this.updateHeatmap();
  }


  onPan(evt) {
    const { x, y } = evt;
    for (const cell of this.touchCells) {
      if (cell.collide(x, y)) {
        this.tohabDataService.onInteractionPan(cell);
        break;
      }
    }
  }

  onSingleTap(evt) {
    const { x, y } = evt;
    for (const cell of this.touchCells) {
      if (cell.collide(x, y)) {
        this.tohabDataService.onInteractionSingleTap(cell);
        break;
      }
    }
  }


  updateCursor(evt = null) {
    this.canvas.select('.cursor').remove();

    const {i, j} = this.tohabDataService.getCursorLocation();
    const cursorCell = this.touchCells.find(
      cell => cell.i === i && cell.j === j
    );
    if (!cursorCell) {
      return;
    }

    this.canvas
      .append('rect')
        .attr('x', cursorCell.x).attr('y', cursorCell.y)
        .attr('width', cursorCell.w).attr('height', cursorCell.h)
        .style('fill', 'transparent')
        .style('stroke', 'purple')
        .style('stroke-width', 5)
        .classed('cursor', true);
  }

  updateValues() {
    this.canvas.selectAll('.cell')
      .style('fill', cell => this.cellValueToColor(cell));
  }

  cellValueToColor(cell: TouchCell) {
    if (cell.type === 'meta') {
      const metaColor = 'rgb(185,122,87)';
      return metaColor;
    } else if (cell.type === 'col' || cell.type === 'row') {
      const headerColor = 'rgb(153,217,234)';
      return headerColor;
    } else {
      const { value, valueDomain } = this.tohabDataService.getValue(cell);
      return d3.interpolateViridis(
          ((value as number) - valueDomain.min) / (valueDomain.max - valueDomain.min)
        );
    }
  }

  updateHeatmap(evt = null) {
    this.canvas.selectAll('*').remove();
    this.makeTouchCells();
    this.canvas.selectAll('rect').data(this.touchCells).enter()
      .append('rect')
        .classed('cell', true)
        .attr('x', cell => cell.x).attr('y', cell => cell.y)
        .attr('width', cell => cell.w).attr('height', cell => cell.h)
        .style('fill', cell => this.cellValueToColor(cell));

    this.updateCursor();
  }

}
