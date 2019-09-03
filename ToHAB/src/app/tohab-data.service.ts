import { Injectable } from '@angular/core';
import { dataCells, colHeaders, rowHeaders } from './mock-data';
import { ToHABData } from './tohab-data';

@Injectable({
  providedIn: 'root'
})
export class ToHABDataService {

  constructor() {
  }

  public getHeatmapData(): ToHABData {
    return {
      rows: rowHeaders,
      columns: colHeaders,
      values: dataCells,
    };
  }


}
