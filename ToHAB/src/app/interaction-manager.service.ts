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
    const doubleTap = new Hammer.Tap({ event: 'double-tap', taps: 2 });
    const singleTap = new Hammer.Tap({ event: 'single-tap', taps: 1 });
    doubleTap.recognizeWith(singleTap);
    singleTap.requireFailure(doubleTap);
    const tripleSwipe = new Hammer.Swipe({
      event: 'tripleswipe',
      pointers: 3
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
        console.log(evt);
        this.fireEvents('pan', evt.center);
      }
    });
    mc.on('doublepan doublepanend', evt => {
      if (evt.deltaTime <= 1000) {
        if (evt.type === 'doublepanend' && evt.scale < 0.5) {
          this.fireEvents('zoom', { direction: 'out' });
        } else if (evt.type === 'doublepanend' && evt.scale > 2) {
          this.fireEvents('zoom', { direction: 'in' });
        } else if (evt.type === 'doublepanend' && evt.velocityX > 0.3 &&
            evt.offsetDirection === Hammer.DIRECTION_RIGHT && evt.distance > 10) {
          alert('2 swipe right');
        } else if (evt.type === 'doublepanend' && evt.velocityX < -0.3 &&
            evt.offsetDirection === Hammer.DIRECTION_LEFT && evt.distance > 10) {
          alert('2 swipe left');
        } else if (evt.type === 'doublepanend' && evt.velocityY > 0.3 &&
            evt.offsetDirection === Hammer.DIRECTION_DOWN && evt.distance > 10) {
          alert('2 swipe down');
        } else if (evt.type === 'doublepanend' && evt.velocityY < -0.3 &&
            evt.offsetDirection === Hammer.DIRECTION_UP && evt.distance > 10) {
          alert('2 swipe up');
        }
      } else if (evt.deltaTime > 1000) {
        /*
        this.fireEvents('drag', {
          currentCenter: evt.center,
        })
        if (evt.type === 'doublepanend' && evt.offsetDirection === Hammer.DIRECTION_RIGHT && evt.distance > 30)
        console.log('drag');
        }
      */
      }
    });
    mc.on('tripleswipe', evt => alert('tripleswipe' + evt.direction));
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
