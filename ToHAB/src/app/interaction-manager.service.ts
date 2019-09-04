import { Injectable } from '@angular/core';
import { copyTouch, ongoingTouchIndexById, colorForTouch } from 'src/utils';
import { InteractionEvent } from './interaction-event';

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
    console.log('touchcancel.');
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
