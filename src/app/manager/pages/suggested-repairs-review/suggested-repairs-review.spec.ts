import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SuggestedRepairsReview } from './suggested-repairs-review';

describe('SuggestedRepairsReview', () => {
  let component: SuggestedRepairsReview;
  let fixture: ComponentFixture<SuggestedRepairsReview>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SuggestedRepairsReview]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SuggestedRepairsReview);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
