import { Component, OnInit, Input } from '@angular/core';
import { ToHABDataService } from '../tohab-data.service';
import { ITouchObject, TouchRectangle } from '../touch-object';
import * as d3 from 'd3';
import { beep } from 'src/utils';
import { SpeakingService } from '../speaking.service';
import { ToHABData } from '../tohab-data';
import { InteractionManagerService } from '../interaction-manager.service';

@Component({
  selector: 'app-touch-canvas',
  templateUrl: './touch-canvas.component.html',
  styleUrls: ['./touch-canvas.component.scss']
})
export class TouchCanvasComponent implements OnInit {


  constructor(
    private speakingService: SpeakingService,
    private tohabDataService: ToHABDataService,
    private interactionManagerService: InteractionManagerService
  ) { }

  private touchObjects: ITouchObject[];
  private touchingObjectIndex = -1;
  private lastTouchedTimestamp = -1;

  canvas: any;

  private makeRect(x, y, w, h, beepSpec = null, vibrationSpec = null, ttsSpec = null) {
    return new TouchRectangle(
        beep, s => this.speakingService.read(s),
        x, y, w, h, beepSpec, vibrationSpec, ttsSpec
      );
  }

  public getTouchObjects(tohab: ToHABData) {
    const touchObjects = [];
    const push = (x: ITouchObject) => touchObjects.push(x);

    const xy_ = (x: number, y: number, range= {x: [0, 100], y: [0, 100]}) => {
      const x_ = (x - range.x[0]) / (range.x[1] - range.x[0]) * window.innerWidth * 0.98;
      const y_ = (y - range.y[0]) / (range.y[1] - range.y[0]) * window.innerHeight * 0.98;
      return {x: x_, y: y_};
    };

    const xy = xy_;
    const { rows, columns, values } = tohab;

    const headerColor = 'rgb(153,217,234)';
    const metaColor = 'rgb(185,122,87)';

    for (let i = 0; i <= values.length; i++) {
      for (let j = 0; j <= values[0].length; j++) {
        const width = 100 / (values[0].length + 1);
        const height = 100 / (values.length + 1);
        const p = xy(width * (j + 0), height * (i + 0));
        const p_ = xy(width * (j + 1), height * (i + 1));
        console.log(width, height, p);
        if (i === 0 && j === 0) {
          push(this.makeRect(p.x, p.y, p_.x - p.x, p_.y - p.y,
            {volume: 10, color: metaColor, stroke: 'rgb(88,88,88)', pitch: 220, duration: 150})
          );
        } else if (i === 0) {
          push(this.makeRect(p.x, p.y, p_.x - p.x, p_.y - p.y,
            {volume: 10, color: headerColor, stroke: 'rgb(88,88,88)', pitch: 220, duration: 150})
          );
        } else if (j === 0) {
          push(this.makeRect(p.x, p.y, p_.x - p.x, p_.y - p.y,
            {volume: 10, color: headerColor, stroke: 'rgb(88,88,88)', pitch: 220, duration: 150})
          );
        } else {
          push(this.makeRect(p.x, p.y, p_.x - p.x, p_.y - p.y,
            {volume: 10, pitch: values[i - 1][j - 1], duration: 150})
          );
        }
      }
    }
    return touchObjects;
  }

  ngOnInit() {
    const el = document.getElementsByTagName('canvas')[0];
    el.addEventListener('touchstart', this.interactionManagerService.handleStart.bind(this.interactionManagerService), false);
    el.addEventListener('touchend', this.interactionManagerService.handleEnd.bind(this.interactionManagerService), false);
    el.addEventListener('touchcancel', this.interactionManagerService.handleCancel.bind(this.interactionManagerService), false);
    el.addEventListener('touchmove', this.interactionManagerService.handleMove.bind(this.interactionManagerService), false);
    console.log('initialized.');

    this.interactionManagerService.on('sweep', this.handleTouchObjects.bind(this));

    const canvas = d3.select('svg');
    canvas.attr('width', window.innerWidth * 0.98).attr('height', window.innerHeight * 0.98);
    this.canvas = canvas;

    this.touchObjects = this.getTouchObjects(this.tohabDataService.getHeatmapData());
    console.log(this.touchObjects);
    this.touchObjects.reverse();
    this.touchObjects.forEach((touchObject, ind) => {
      if (touchObject.type === 'circle') {
        canvas.append('circle').attr('cx', touchObject.cx).attr('cy', touchObject.cy).attr('r', touchObject.r)
          .style('fill', touchObject.style.fill);
      } else if (touchObject.type === 'rectangle') {
        canvas.append('rect').attr('x', touchObject.x).attr('y', touchObject.y).attr('width', touchObject.w).attr('height', touchObject.h)
          .style('fill', touchObject.style.fill)
          .style('stroke', _ => {
            if (this.touchingObjectIndex === ind) {
              return 'purple';
            } else if (touchObject.style.stroke) {
              return touchObject.style.stroke;
            }
            return null;
          });
      } else if (touchObject.type === 'line') {
        canvas.append('line')
          .attr('x1', touchObject.x1).attr('y1', touchObject.y1)
          .attr('x2', touchObject.x2).attr('y2', touchObject.y2)
          .style('stroke', touchObject.style.fill)
          .style('stroke-width', 6);
      }
    });
    this.touchObjects.reverse();
  }

  handleTouchObjects(evt) {
    const x = evt.touchX, y = evt.touchY;
    for (const touchObj of this.touchObjects) {
      if (touchObj.collide(x, y)) {
        const idx = this.touchObjects.indexOf(touchObj);
        if (this.touchingObjectIndex !== idx && this.lastTouchedTimestamp + 100 < Date.now()) {
          this.touchingObjectIndex = idx;
          this.lastTouchedTimestamp = Date.now();
          touchObj.notify();
        }
        this.canvas.select('.cursor').remove();
        this.canvas.append('rect').attr('x', touchObj.x).attr('y', touchObj.y).attr('width', touchObj.w).attr('height', touchObj.h)
          .style('fill', 'transparent')
          .style('stroke', 'purple')
          .style('stroke-width', 10)
          .classed('cursor', true);
        break;
      }
    }
  }

}
