import { Injectable } from '@angular/core';
import { SpeakingService } from './speaking.service';
import { TouchCell } from './touch-object';
import { ToHABDataService } from './tohab-data.service';

@Injectable({
  providedIn: 'root'
})
export class DescriptionService {

  pitchDomain = {
    min: 220,
    max: 1660
  }

  constructor(
    private speakingService: SpeakingService
  ) { }

  convertToPitch({value, valueDomain}){
    const r = (value - valueDomain.min) / (valueDomain.max - valueDomain.min);
    return this.pitchDomain.min + (this.pitchDomain.max - this.pitchDomain.min) * r
  }

  describeCell({cellType, cellValue, navigationMode}) {
    console.log({cellType, cellValue, navigationMode})
    const {range, value, valueType, valueDomain} = cellValue;
    window.navigator.vibrate(1000);
    if (navigationMode === 'primary') {
      let description;
      if (Math.max(range.w, range.h) > 1) {
        description = `
          The ${valueType} is ${Math.floor(value * 100) / 100},
          in row ${range.i + 1} ${range.h > 1 ? 'to' + (range.i + range.h) : ''},
          and column ${range.j + 1} ${range.w > 1 ? 'to' + (range.j + range.w) : ''}
        `;
      } else {
        description = `
          ${Math.floor(value * 100) / 100},
          in row ${range.i + 1} and column ${range.j + 1}
        `;
      }
      this.speakingService.read(description);
    } else {
      this.speakingService.beep(
        10,
        cellType === 'data' ?
          this.convertToPitch({value, valueDomain}) :
          150,
        150
      );
    }
  }

  describeNavigationMode({navigationMode}) {
    if (navigationMode === 'primary') {
      this.speakingService.read('Navigation mode has change to value mode');
    } else {
      this.speakingService.read('Navigation mode has changed to pitch mode');
    }
  }
}
