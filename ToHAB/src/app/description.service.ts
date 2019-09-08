import { Injectable } from '@angular/core';
import { SpeakingService } from './speaking.service';
import { TouchCell } from './touch-object';
import { ToHABDataService } from './tohab-data.service';
import { ToHABData } from './tohab-data';

@Injectable({
  providedIn: 'root'
})
export class DescriptionService {

  pitchDomain = {
    min: 220,
    max: 1760
  };

  constructor(
    private speakingService: SpeakingService
  ) { }

  convertToPitch({value, valueDomain}) {
    const r = (value - valueDomain.min) / (valueDomain.max - valueDomain.min);
    return this.pitchDomain.min + (this.pitchDomain.max - this.pitchDomain.min) * r;
  }

  describeCell({cellType, cellValue, navigationMode}) {
    console.log({cellType, cellValue, navigationMode});
    window.navigator.vibrate(100);
    if (navigationMode === 'primary') {
      const {range, value, valueType, valueDomain} = cellValue;
      let description;
      if (cellType === 'data') {
        if (Math.max(range.w, range.h) > 1) {
          description = `${Math.floor(value * 100) / 100} is the ${valueType} of values in`;
          description += ` row ${range.i + 1} ${range.h > 1 ? 'to ' + (range.i + range.h) : ''},`;
          description += ` and column ${range.j + 1} ${range.w > 1 ? 'to ' + (range.j + range.w) : ''}`;
        } else {
          description = `
            ${Math.floor(value * 100) / 100} in row ${range.i + 1} and column ${range.j + 1}
          `;
        }
      } else if (cellType === 'row') {
        description = `
          row ${range.i + 1} ${range.h > 1 ? 'to' + (range.i + range.h) : ''},
          ${value}
        `;
      } else if (cellType === 'col') {
        description = `
          column ${range.j + 1} ${range.w > 1 ? 'to' + (range.j + range.w) : ''}
          ${value}
        `;
      } else if (cellType === 'meta') {
        description = `
          ${value}
        `;
      }
      this.speakingService.read(description);
    } else {
      const {value, melody, valueDomain} = cellValue;
      if (cellType === 'data') {
        this.speakingService.beep(10, this.convertToPitch({value, valueDomain}), 150);
      } else if (cellType === 'row' || cellType === 'col') {
        const beeps = [
          {pitch: 100, duration: 500, volume: 10},
        ].concat(
          melody.map(thatCellValue => ({
            pitch: this.convertToPitch({value: thatCellValue.value, valueDomain: thatCellValue.valueDomain}),
            duration: 150,
            volume: 10
          }))
        );
        this.speakingService.consecutiveBeep(beeps);
      } else if (cellType === 'meta') {
        this.speakingService.beep(10, 150, 150);
      }
    }
  }

  describeNavigationMode({navigationMode}) {
    if (navigationMode === 'primary') {
      this.speakingService.read('Navigation mode has change to value mode');
    } else {
      this.speakingService.read('Navigation mode has changed to pitch mode');
    }
  }

  read(message: string) {
    this.speakingService.read(message);
  }

  readMessages(messages: string[]) {
    this.read(messages.join('. '));
  }

}
