export class HeatMapData {
  rows: string[];
  columns: string[];
  values: number[][];
  valueRange: {
    min: number,
    max: number
  }
  cursor: {
    i: number,
    j: number,
    lock: boolean,
    lock_i: number,
    lock_j: number
  };
}
