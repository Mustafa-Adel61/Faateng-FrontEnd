import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ReportsReviewQueue } from './reports-review-queue';

describe('ReportsReviewQueue', () => {
  let component: ReportsReviewQueue;
  let fixture: ComponentFixture<ReportsReviewQueue>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ReportsReviewQueue]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ReportsReviewQueue);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
