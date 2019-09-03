import { TestBed } from '@angular/core/testing';

import { ToHABDataService } from './tohab-data.service';

describe('ToHABDataService', () => {
  beforeEach(() => TestBed.configureTestingModule({}));

  it('should be created', () => {
    const service: ToHABDataService = TestBed.get(ToHABDataService);
    expect(service).toBeTruthy();
  });
});
