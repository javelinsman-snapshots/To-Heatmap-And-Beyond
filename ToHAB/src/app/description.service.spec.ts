import { TestBed } from '@angular/core/testing';

import { DescriptionService } from './description.service';

describe('DescriptionService', () => {
  beforeEach(() => TestBed.configureTestingModule({}));

  it('should be created', () => {
    const service: DescriptionService = TestBed.get(DescriptionService);
    expect(service).toBeTruthy();
  });
});
