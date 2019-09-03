import { Component, OnInit, Input } from '@angular/core';
import { copyTouch, colorForTouch, ongoingTouchIndexById, log } from 'src/utils';
import { ToHABDataService } from '../tohab-data.service';
import { ITouchObject, TouchRectangle } from '../touch-object';
import * as d3 from 'd3';
import { beep } from 'src/utils';
import { SpeakingService } from '../speaking.service';
import { ToHABData } from '../tohab-data';

@Component({
  selector: 'app-touch-canvas',
  templateUrl: './touch-canvas.component.html',
  styleUrls: ['./touch-canvas.component.scss']
})
export class TouchCanvasComponent implements OnInit {

  ongoingTouches = [];

  constructor(
    private speakingService: SpeakingService,
    private tohabDataService: ToHABDataService
  ) { }

  private touchObjects: ITouchObject[];
  private touchingObjectIndex = -1;
  private lastTouchedTimestamp = -1;

  canvas: any;

  private makeRect(x, y, w, h, beepSpec = null, vibrationSpec = null, ttsSpec = null) {
    return new TouchRectangle(
        beep, x => this.speakingService.read(x),
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
        if (i == 0 && j == 0) {
          push(this.makeRect(p.x, p.y, p_.x - p.x, p_.y - p.y, {volume: 10, color: metaColor, stroke: 'rgb(88,88,88)', pitch: 220, duration: 150}));
        } else if (i == 0) {
          push(this.makeRect(p.x, p.y, p_.x - p.x, p_.y - p.y, {volume: 10, color: headerColor, stroke: 'rgb(88,88,88)', pitch: 220, duration: 150}));
        } else if (j == 0) {
          push(this.makeRect(p.x, p.y, p_.x - p.x, p_.y - p.y, {volume: 10, color: headerColor, stroke: 'rgb(88,88,88)', pitch: 220, duration: 150}));
        } else {
          push(this.makeRect(p.x, p.y, p_.x - p.x, p_.y - p.y, {volume: 10, pitch: values[i - 1][j - 1], duration: 150}));
        }
      }
    }
    return touchObjects;
  }

  ngOnInit() {
    const el = document.getElementsByTagName('canvas')[0];
    el.addEventListener('touchstart', this.handleStart.bind(this), false);
    el.addEventListener('touchend', this.handleEnd.bind(this), false);
    el.addEventListener('touchcancel', this.handleCancel.bind(this), false);
    el.addEventListener('touchmove', this.handleMove.bind(this), false);
    console.log('initialized.');

    d3.select(el).attr('width', window.innerWidth * 0.98).attr('height', window.innerHeight * 0.98);

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
            } else if(touchObject.style.stroke) {
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

  handleTouchObjects(x: number, y: number) {
    for (const touchObj of this.touchObjects) {
      if (touchObj.collide(x, y)) {
        const idx = this.touchObjects.indexOf(touchObj);
        if (this.touchingObjectIndex !== idx && this.lastTouchedTimestamp + 100 < Date.now()) {
          this.touchingObjectIndex = idx;
          this.lastTouchedTimestamp = Date.now();
          touchObj.notify();
          log(idx + 'notify');
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

  handleStart(evt) {
    evt.preventDefault();
    console.log('touchstart.');
    const touches = evt.changedTouches;
    for (let i = 0; i < touches.length; i++) {
      this.ongoingTouches.push(copyTouch(touches[i]));
    }
    this.handleMove(evt);
    /*
    const el = document.getElementsByTagName('canvas')[0];
    const ctx = el.getContext('2d');
    const touches = evt.changedTouches;

    for (let i = 0; i < touches.length; i++) {
      console.log('touchstart:' + i + '...');
      this.ongoingTouches.push(copyTouch(touches[i]));
      const color = colorForTouch(touches[i]);
      ctx.beginPath();
      ctx.arc(touches[i].pageX, touches[i].pageY, 4, 0, 2 * Math.PI, false);  // a circle at the start
      ctx.fillStyle = color;
      ctx.fill();
      console.log('touchstart:' + i + '.');
    }
    */
  }

  handleEnd(evt) {
    evt.preventDefault();
    log('touchend');
    const touches = evt.changedTouches;
    for (let i = 0; i < touches.length; i++) {
      const idx = ongoingTouchIndexById(this.ongoingTouches, touches[i].identifier);
      this.ongoingTouches.splice(idx, 1);  // remove it; we're done
    }
    /*
    const el = document.getElementsByTagName('canvas')[0];
    const ctx = el.getContext('2d');
    const touches = evt.changedTouches;

    for (let i = 0; i < touches.length; i++) {
      const color = colorForTouch(touches[i]);
      const idx = ongoingTouchIndexById(this.ongoingTouches, touches[i].identifier);

      if (idx >= 0) {
        ctx.lineWidth = 4;
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.moveTo(this.ongoingTouches[idx].pageX, this.ongoingTouches[idx].pageY);
        ctx.lineTo(touches[i].pageX, touches[i].pageY);
        ctx.fillRect(touches[i].pageX - 4, touches[i].pageY - 4, 8, 8);  // and a square at the end
        this.ongoingTouches.splice(idx, 1);  // remove it; we're done
      } else {
        console.log('can\'t figure out which touch to end');
      }
    }
    */
  }

  handleCancel(evt) {
    evt.preventDefault();
    console.log('touchcancel.');
    const touches = evt.changedTouches;

    for (let i = 0; i < touches.length; i++) {
      const idx = ongoingTouchIndexById(this.ongoingTouches, touches[i].identifier);
      this.ongoingTouches.splice(idx, 1);  // remove it; we're done
    }
  }

  handleMove(evt) {
    evt.preventDefault();
    const el = document.getElementsByTagName('canvas')[0];
    const ctx = el.getContext('2d');
    const touches = evt.changedTouches;

    for (let i = 0; i < touches.length; i++) {
      const color = colorForTouch(touches[i]);
      const idx = ongoingTouchIndexById(this.ongoingTouches, touches[i].identifier);

      if (idx >= 0) {
        console.log('continuing touch ' + idx);
        const touchX = touches[i].pageX;
        const touchY = touches[i].pageY;
        this.handleTouchObjects(touchX, touchY);

        /*
        ctx.beginPath();
        console.log('ctx.moveTo(' + this.ongoingTouches[idx].pageX + ', ' + this.ongoingTouches[idx].pageY + ');');
        ctx.moveTo(this.ongoingTouches[idx].pageX, this.ongoingTouches[idx].pageY);
        console.log('ctx.lineTo(' + touches[i].pageX + ', ' + touches[i].pageY + ');');
        ctx.lineTo(touches[i].pageX, touches[i].pageY);
        ctx.lineWidth = 4;
        ctx.strokeStyle = color;
        ctx.stroke();
        */

        this.ongoingTouches.splice(idx, 1, copyTouch(touches[i]));  // swap in the new touch record
        console.log('.');
      } else {
        console.log('can\'t figure out which touch to continue');
      }
    }
  }

}
