import { Injectable } from '@angular/core';
import { ITouchObject, TouchCircle, TouchRectangle, TouchLine } from './touch-object';
import { SpeakingService } from './speaking.service';
import { beep } from 'src/utils';
import { dataCells, colHeaders, rowHeaders } from './mock-data';

@Injectable({
  providedIn: 'root'
})
export class TouchObjectService {

  constructor(private speakingService: SpeakingService) {
  }

  public getTouchObjects(exampleId: number) {
    const touchObjects = [];
    const push = (x: ITouchObject) => touchObjects.push(x);

    const xy_ = (x: number, y: number, range= {x: [0, 100], y: [0, 100]}) => {
      const x_ = (x - range.x[0]) / (range.x[1] - range.x[0]) * window.innerWidth * 0.98;
      const y_ = (y - range.y[0]) / (range.y[1] - range.y[0]) * window.innerHeight * 0.98;
      return {x: x_, y: y_};
    };

    const xy = xy_;
    console.log({dataCells, rowHeaders, colHeaders});

    const headerColor = 'rgb(153,217,234)';
    const metaColor = 'rgb(185,122,87)';

    for (let i = 0; i <= dataCells.length; i++) {
      for (let j = 0; j <= dataCells[0].length; j++) {
        const width = 100 / (dataCells[0].length + 1);
        const height = 100 / (dataCells.length + 1);
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
          push(this.makeRect(p.x, p.y, p_.x - p.x, p_.y - p.y, {volume: 10, pitch: dataCells[i-1][j-1], duration: 150}));
        }
      }
    }



    /*
    if (exampleId === 1) {
      push(this.makeCircle(110, 230, 10, {volume: 10, pitch: 500, duration: 150}, {pattern: 50}, {text: '좌표 5 컴마 2에 있는 점'}));
      push(this.makeLine(30, 230, 110, 230, {volume: 10, pitch: 200, duration: 150}, {pattern: [25, 25, 25]}, {text: '세로 점선'}));
      push(this.makeLine(110, 20, 110, 230, {volume: 10, pitch: 200, duration: 150}, {pattern: [25, 25, 25]}, {text: '가로 점선'}));
      for (let i = 0; i < 11; i++) {
        push(this.makeRect(20, 30 + 50 * i, 30, 10, {volume: 10, pitch: 300, duration: 150}, {pattern: 50}, {text: `x축 좌표: ${i}`}));
      }
      push(this.makeRect(30, 30, 10, 530, {volume: 10, pitch: 300, duration: 150}, {pattern: 50}, {text: 'x축 막대'}));
      for (let i = 0; i < 7; i++) {
        push(this.makeRect(30 + 40 * i, 20, 10, 30, {volume: 10, pitch: 300, duration: 150}, {pattern: 50}, {text: `y축 좌표: ${i}`}));
      }
      push(this.makeRect(30, 30, 270, 10, {volume: 10, pitch: 300, duration: 150}, {pattern: 50}, {text: 'y축 막대'}));
    } else if (exampleId === 2) {
      const xy = (x: number, y: number) => xy_(x, y, {x: [-50, 50], y: [-30, 30]});
      push(this.makeLine(xy(-50, 0).x, xy(-50, 0).y, xy(50, 0).x, xy(50, 0).y,
        {volume: 10, pitch: 200, duration: 150}, {pattern: 50}, {text: 'x축 막대'}));
      push(this.makeLine(xy(0, -30).x, xy(0, -30).y, xy(0, 30).x, xy(0, 30).y,
        {volume: 10, pitch: 200, duration: 150}, {pattern: 50}, {text: 'y축 막대'}));
      push(this.makeLine(xy(-30, -30).x, xy(-30, -30).y, xy(30, 30).x, xy(30, 30).y,
        {volume: 10, pitch: 400, duration: 150}, {pattern: 50}, {text: 'y는 x의 그래프'}));
      push(this.makeLine(xy(-30, -60).x, xy(-30, -60).y, xy(30, 60).x, xy(30, 60).y,
        {volume: 10, pitch: 550, duration: 150}, {pattern: 50}, {text: 'y는 2 곱하기 x의 그래프'}));
      // push(this.makeRect(150, 30, 10, 530, {volume: 10, pitch: 300, duration: 150}, {pattern: 50}, {text: 'x축 막대'}));
      // push(this.makeRect(10, 280, 300, 10, {volume: 10, pitch: 300, duration: 150}, {pattern: 50}, {text: 'y축 막대'}));
      // push(this.makeLine(30, 30, 290, 560, {volume: 10, pitch: 500, duration: 150}, {pattern: 50}, {text: 'y는 x의 그래프'}));
      push(
        this.makeRect(0, 0, 330, 600, null, {pattern: [25, 25, 25]})
      );
    } else if (exampleId === 3) {
      const xy = (x: number, y: number) => xy_(x, y, {x: [-10, 10], y: [-30, 200]});
      push(this.makeLine(xy(-50, 0).x, xy(-50, 0).y, xy(50, 0).x, xy(50, 0).y,
        {volume: 10, pitch: 200, duration: 150}, {pattern: 50}, {text: 'x축 막대'}));
      push(this.makeLine(xy(0, -30).x, xy(0, -30).y, xy(0, 200).x, xy(0, 200).y,
        {volume: 10, pitch: 200, duration: 150}, {pattern: 50}, {text: 'y축 막대'}));
      for (let x = -10; x <= 10; x += 0.1) {
        push(this.makeLine(xy(x, x * x).x, xy(x, x * x).y, xy((x + 0.1), (x + 0.1) * (x + 0.1)).x, xy((x + 0.1), (x + 0.1) * (x + 0.1)).y,
          {volume: 10, pitch: 660, duration: 150}, {pattern: 50}, {text: 'y는 x제곱의 그래프'}));
      }
      for (let x = -10; x <= 10; x += 0.1) {
        push(this.makeLine(xy(x, 2 * x * x).x, xy(x, 2 * x * x).y, xy((x + 0.1), 2 * (x + 0.1) * (x + 0.1)).x, xy((x + 0.1), 2 * (x + 0.1) * (x + 0.1)).y,
          {volume: 10, pitch: 783, duration: 150}, {pattern: 50}, {text: 'y는 2 곱하기 x제곱의 그래프'}));
      }
      for (let x = -10; x <= 10; x += 0.1) {
        push(this.makeLine(xy(x, 5 * x * x).x, xy(x, 5 * x * x).y, xy((x + 0.1), 5 * (x + 0.1) * (x + 0.1)).x, xy((x + 0.1), 5 * (x + 0.1) * (x + 0.1)).y,
          {volume: 10, pitch: 1046, duration: 150}, {pattern: 50}, {text: 'y는 5 곱하기 x제곱의 그래프'}));
      }
      push(
        this.makeRect(0, 0, 330, 600, null, {pattern: [25, 25, 25]})
      );
    } else {
      const xy = (x: number, y: number) => xy_(x, y, {x: [-10, 10], y: [-1.5, 1.5]});
      push(this.makeLine(xy(-50, 0).x, xy(-50, 0).y, xy(50, 0).x, xy(50, 0).y,
        {volume: 10, pitch: 200, duration: 150}, {pattern: 50}, {text: 'x축 막대'}));
      push(this.makeLine(xy(0, -1.5).x, xy(0, -1.5).y, xy(0, 1.5).x, xy(0, 1.5).y,
        {volume: 10, pitch: 200, duration: 150}, {pattern: 50}, {text: 'y축 막대'}));
      for (let x = -10; x <= 10; x += 0.1) {
        push(this.makeLine(xy(x, Math.sin(x)).x, xy(x, Math.sin(x)).y, xy((x + 0.1), Math.sin(x + 0.1)).x, xy((x + 0.1), Math.sin(x + 0.1)).y,
          {volume: 10, pitch: 660, duration: 150}, {pattern: 50}, {text: 'y는 싸인 x의 그래프'}));
      }

    }
    */

    /*
    push(
      this.makeRect(0, 0, 300, 600, null)
    );
    */

    return touchObjects;
  }


  /*
  makeCluster(cx, cy, r, n, pitch, name) {
    for (let i = 0; i < n; i++) {
      const x = Math.round((cx + Math.random() * r));
      const y = Math.round((cy + Math.random() * r));
      this.touchObjects.push(
        this.makeCircle(x, y, 20, {volume: 10, pitch: pitch, duration: 150}, {pattern: 50}, {text: `소득 ${y - 30}천원 사교육비 ${x - 30}만원 ${name}`}),
      )
    }
  }
  */

  private makeCircle(cx, cy, r, beepSpec = null, vibrationSpec = null, ttsSpec = null) {
    return new TouchCircle(beep, x => this.speakingService.read(x), cx, cy, r, beepSpec, vibrationSpec, ttsSpec);
  }

  private makeRect(x, y, w, h, beepSpec = null, vibrationSpec = null, ttsSpec = null) {
    return new TouchRectangle(beep, x => this.speakingService.read(x), x, y, w, h, beepSpec, vibrationSpec, ttsSpec);
  }
  private makeLine(x1, y1, x2, y2, beepSpec = null, vibrationSpec = null, ttsSpec = null) {
    return new TouchLine(beep, x => this.speakingService.read(x), x1, y1, x2, y2, beepSpec, vibrationSpec, ttsSpec);
  }
}
