import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ReportsCompliance } from './reports-compliance';

describe('ReportsCompliance', () => {
  let component: ReportsCompliance;
  let fixture: ComponentFixture<ReportsCompliance>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ReportsCompliance]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ReportsCompliance);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
