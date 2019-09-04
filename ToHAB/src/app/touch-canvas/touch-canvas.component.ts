import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { ToHABDataService } from '../tohab-data.service';
import { TouchCell } from '../touch-object';
import * as d3 from 'd3';
import { HeatMapData } from '../tohab-data';
import { InteractionManagerService } from '../interaction-manager.service';

@Component({
  selector: 'app-touch-canvas',
  templateUrl: './touch-canvas.component.html',
  styleUrls: ['./touch-canvas.component.scss']
})
export class TouchCanvasComponent implements OnInit {

  @Output() sweep: EventEmitter<any> = new EventEmitter();

  constructor(
    private tohabDataService: ToHABDataService,
    private interactionManagerService: InteractionManagerService
  ) { }

  private touchCells: TouchCell[];

  heatmapData: HeatMapData;

  canvas: any;

  public makeTouchCells() {
    this.touchCells = [];

    const transformCoordinate = (x: number, y: number, range= {x: [0, 100], y: [0, 100]}) => {
      const x_ = (x - range.x[0]) / (range.x[1] - range.x[0]) * window.innerWidth * 0.98;
      const y_ = (y - range.y[0]) / (range.y[1] - range.y[0]) * window.innerHeight * 0.98;
      return {x: x_, y: y_};
    };

    const { values } = this.heatmapData;

    for (let i = 0; i <= values.length; i++) {
      for (let j = 0; j <= values[0].length; j++) {
        const width = 100 / (values[0].length + 1);
        const height = 100 / (values.length + 1);
        const p = transformCoordinate(width * (j + 0), height * (i + 0));
        const p_ = transformCoordinate(width * (j + 1), height * (i + 1));
        console.log(width, height, p);
        if (i === 0 && j === 0) {
          this.touchCells.push(new TouchCell({
            type: 'meta',
            x: p.x, y: p.y, w: p_.x - p.x, h: p_.y - p.y, i, j
          }));
        } else if (i === 0) {
          this.touchCells.push(new TouchCell({
            type: 'col',
            x: p.x, y: p.y, w: p_.x - p.x, h: p_.y - p.y, i, j
          }));
        } else if (j === 0) {
          this.touchCells.push(new TouchCell({
            type: 'row',
            x: p.x, y: p.y, w: p_.x - p.x, h: p_.y - p.y, i, j
          }));
        } else {
          this.touchCells.push(new TouchCell({
            type: 'data',
            x: p.x, y: p.y, w: p_.x - p.x, h: p_.y - p.y, i, j,
            value: values[i - 1][j - 1]
          }));
        }
      }
    }
  }

  ngOnInit() {
    const el = document.getElementsByTagName('canvas')[0];
    el.addEventListener('touchstart', this.interactionManagerService.handleStart.bind(this.interactionManagerService), false);
    el.addEventListener('touchend', this.interactionManagerService.handleEnd.bind(this.interactionManagerService), false);
    el.addEventListener('touchcancel', this.interactionManagerService.handleCancel.bind(this.interactionManagerService), false);
    el.addEventListener('touchmove', this.interactionManagerService.handleMove.bind(this.interactionManagerService), false);
    console.log('initialized.');

    this.interactionManagerService.on('sweep', this.onSweep.bind(this));
    this.tohabDataService.on('update-heatmap', this.updateHeatmap.bind(this));
    this.tohabDataService.on('update-cursor', this.updateCursor.bind(this));
    this.updateHeatmap();
  }

  updateCursor(evt = null) {
    this.heatmapData = this.tohabDataService.getHeatmapData();
    const { cursor } = this.heatmapData;
    const cursorCell = this.touchCells.find(cell => cell.i === cursor.i && cell.j === cursor.j);

    this.canvas.select('.cursor').remove();
    this.canvas.append('rect')
      .attr('x', cursorCell.x).attr('y', cursorCell.y)
      .attr('width', cursorCell.w).attr('height', cursorCell.h)
      .style('fill', 'transparent')
      .style('stroke', 'purple')
      .style('stroke-width', 5)
      .classed('cursor', true);
  }

  updateHeatmap(evt = null) {
    const canvas = d3.select('svg');
    canvas.attr('width', window.innerWidth * 0.98).attr('height', window.innerHeight * 0.98);
    this.canvas = canvas;

    this.heatmapData = this.tohabDataService.getHeatmapData();
    this.makeTouchCells();

    const { valueRange } = this.heatmapData;

    this.canvas.selectAll('rect').data(this.touchCells).enter().append('rect')
      .attr('x', cell => cell.x)
      .attr('y', cell => cell.y)
      .attr('width', cell => cell.w)
      .attr('height', cell => cell.h)
      .style('fill', cell => ((cell: TouchCell) => {
          if (cell.type === 'meta') {
            const metaColor = 'rgb(185,122,87)';
            return metaColor;
          } else if (cell.type === 'col' || cell.type === 'row') {
            const headerColor = 'rgb(153,217,234)';
            return headerColor;
          } else {
            return d3.interpolateViridis(((cell.value as number) - valueRange.min) / (valueRange.max - valueRange.min));
          }
        })(cell));

    this.updateCursor();
  }

  onSweep(evt) {
    const x = evt.touchX, y = evt.touchY;
    for (const cell of this.touchCells) {
      if (cell.collide(x, y)) {
        this.sweep.emit(cell);
        break;
      }
    }

  }

}
