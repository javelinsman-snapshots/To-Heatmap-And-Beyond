import { Injectable } from '@angular/core';
import { InteractionEvent } from './interaction-event';
import Hammer from 'hammerjs';

@Injectable({
  providedIn: 'root'
})
export class InteractionManagerService {

  callbacks = {};
  ongoingTouches = [];

  previousDoublePan;

  constructor() {
    // for debugging purpose
    document.onkeypress = (event) => {
      if (event.key === '-') {
        this.fireEvents('zoom', { direction: 'out' });
      } else if (event.key === '+') {
        this.fireEvents('zoom', { direction: 'in' });
      }
    }
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

  bindElement(element: Element) {
    const mc = new Hammer.Manager(element);
    const singleTap = new Hammer.Tap({ event: 'single-tap', taps: 1 });
    const doubleTap = new Hammer.Tap({ event: 'double-tap', taps: 2 });
    doubleTap.recognizeWith(singleTap);
    singleTap.requireFailure(doubleTap);
    const tripleSwipe = new Hammer.Swipe({
      event: 'three-finger-swipe',
      direction: Hammer.DIRECTION_HORIZONTAL,
      pointers: 3,
    });
    const pan = new Hammer.Pan({ event: 'pan' , pointers: 1 });
    const doublePan = new Hammer.Pan({ event: 'doublepan', pointers: 2 });
    mc.add([doubleTap, singleTap, doublePan, pan, tripleSwipe]);
    mc.on('double-tap', () => this.fireEvents('double-tap', {}));
    mc.on('single-tap', evt => this.fireEvents('single-tap', evt.center));
    mc.on('pan panend', evt => {
      if (evt.maxPointers > 1) {
        return;
      }
      if (evt.type === 'panend' && evt.deltaTime <= 500 && evt.velocityX < -0.3 &&
          evt.offsetDirection === Hammer.DIRECTION_LEFT && evt.distance > 10) {
        this.fireEvents('swipe', {direction: 'left'});
      } else if (evt.type === 'panend' && evt.deltaTime <= 500 && evt.velocityX > 0.3 &&
          evt.offsetDirection === Hammer.DIRECTION_RIGHT && evt.distance > 10) {
        this.fireEvents('swipe', {direction: 'right'});
      } else if (evt.type === 'panend' && evt.deltaTime <= 500 && evt.velocityY > 0.3 &&
          evt.offsetDirection === Hammer.DIRECTION_DOWN && evt.distance > 10) {
        this.fireEvents('swipe', {direction: 'down'});
      } else if (evt.type === 'panend' && evt.deltaTime <= 500 && evt.velocityY < -0.3 &&
          evt.offsetDirection === Hammer.DIRECTION_UP && evt.distance > 10) {
        this.fireEvents('swipe', {direction: 'up'});
      } else if (evt.deltaTime > 500) {
        this.fireEvents('pan', evt.center);
      }
    });
    mc.on('doublepanstart', evt => {
      this.previousDoublePan = evt;
    });
    mc.on('doublepan doublepanend', evt => {
      if (evt.deltaTime <= 500) {
        if (evt.type === 'doublepanend' && evt.scale < 0.5) {
          this.fireEvents('zoom', { direction: 'out' });
        } else if (evt.type === 'doublepanend' && evt.scale > 2) {
          this.fireEvents('zoom', { direction: 'in' });
        } else if (evt.type === 'doublepanend' && evt.velocityX > 0.3 &&
            evt.offsetDirection === Hammer.DIRECTION_RIGHT && evt.distance > 10) {
          this.fireEvents('lock', {direction: 'horizontal'});
        } else if (evt.type === 'doublepanend' && evt.velocityX < -0.3 &&
            evt.offsetDirection === Hammer.DIRECTION_LEFT && evt.distance > 10) {
          this.fireEvents('lock', {direction: 'horizontal'});
        } else if (evt.type === 'doublepanend' && evt.velocityY > 0.3 &&
            evt.offsetDirection === Hammer.DIRECTION_DOWN && evt.distance > 10) {
          this.fireEvents('lock', {direction: 'vertical'});
        } else if (evt.type === 'doublepanend' && evt.velocityY < -0.3 &&
            evt.offsetDirection === Hammer.DIRECTION_UP && evt.distance > 10) {
          this.fireEvents('lock', {direction: 'vertical'});
        }
      } else {
        this.fireEvents('drag', {
          dx: evt.center.x - this.previousDoublePan.center.x,
          dy: evt.center.y - this.previousDoublePan.center.y,
          end: evt.type === 'doublepanend'
        });
        this.previousDoublePan = evt;
      }

    });
    mc.on('three-finger-swipe', evt => this.fireEvents('three-finger-swipe', {
      direction: evt.direction === Hammer.DIRECTION_RIGHT ? 'right' : 'left'
    }));
  }
}
