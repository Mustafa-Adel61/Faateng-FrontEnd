import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SuggestedRepairsDetails } from './suggested-repairs-details';

describe('SuggestedRepairsDetails', () => {
  let component: SuggestedRepairsDetails;
  let fixture: ComponentFixture<SuggestedRepairsDetails>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SuggestedRepairsDetails]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SuggestedRepairsDetails);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
