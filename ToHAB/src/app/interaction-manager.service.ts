import { Injectable } from '@angular/core';
import { copyTouch, ongoingTouchIndexById, colorForTouch } from 'src/utils';
import { InteractionEvent } from './interaction-event';
import Hammer from 'hammerjs';

@Injectable({
  providedIn: 'root'
})
export class InteractionManagerService {

  callbacks = {};
  ongoingTouches = [];

  constructor() { }

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

  bindElement(element: Element) {
    const mc = new Hammer.Manager(element);
    const doubleTap = new Hammer.Tap({ event: 'doubletap', taps: 2 });
    const singleTap = new Hammer.Tap({ event: 'tap', taps: 1 });
    doubleTap.recognizeWith(singleTap);
    singleTap.requireFailure(doubleTap);
    const tripleSwipe = new Hammer.Swipe({
      event: 'tripleswipe',
      pointers: 3
    });
    const pan = new Hammer.Pan({ event: 'pan' });
    const doublePan = new Hammer.Pan({ event: 'doublepan', pointers: 2 });
    mc.add([doubleTap, singleTap, pan, doublePan, tripleSwipe]);
    mc.on('doubletap', evt => alert('doubletap' + evt.direction));
    mc.on('tap', evt => alert('tap' + evt.direction));
    mc.on('swipe', evt => alert('swipe' + evt.direction));
    mc.on('tripleswipe', evt => alert('tripleswipe' + evt.direction));
    mc.on('pan panend', evt => {
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
    mc.on('doublepan doublepanend', evt => {
      if (evt.type === 'doublepanend' && evt.deltaTime <= 1000 && evt.scale < 0.5) {
        alert('zoom out');
      } else if (evt.type === 'doublepanend' && evt.deltaTime <= 1000 && evt.scale > 3) {
        alert('zoom in');
      }
    });

  }

  handleStart(evt) {
    console.log('interaction manager: handle start');
    evt.preventDefault();
    const touches = evt.changedTouches;
    for (let i = 0; i < touches.length; i++) {
      this.ongoingTouches.push(copyTouch(touches[i]));
    }
    this.handleMove(evt);
  }

  handleEnd(evt) {
    console.log('interaction manager: handle end');
    evt.preventDefault();
    const touches = evt.changedTouches;
    for (let i = 0; i < touches.length; i++) {
      const idx = ongoingTouchIndexById(this.ongoingTouches, touches[i].identifier);
      this.ongoingTouches.splice(idx, 1);  // remove it; we're done
    }
  }

  handleCancel(evt) {
    console.log('interaction manager: handle cancel');
    evt.preventDefault();
    const touches = evt.changedTouches;
    for (let i = 0; i < touches.length; i++) {
      const idx = ongoingTouchIndexById(this.ongoingTouches, touches[i].identifier);
      this.ongoingTouches.splice(idx, 1);  // remove it; we're done
    }
  }

  handleMove(evt) {
    console.log('interaction manager: handle move');
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
        this.fireEvents('sweep', { touchX, touchY });
        this.ongoingTouches.splice(idx, 1, copyTouch(touches[i]));  // swap in the new touch record
        console.log('.');
      } else {
        console.log('can\'t figure out which touch to continue');
      }
    }
  }

}
