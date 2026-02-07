import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SuggestedRepairs } from './suggested-repairs';

describe('SuggestedRepairs', () => {
  let component: SuggestedRepairs;
  let fixture: ComponentFixture<SuggestedRepairs>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SuggestedRepairs]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SuggestedRepairs);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
