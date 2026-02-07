import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FinanceLayout } from './finance-layout';

describe('FinanceLayout', () => {
  let component: FinanceLayout;
  let fixture: ComponentFixture<FinanceLayout>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FinanceLayout]
    })
    .compileComponents();

    fixture = TestBed.createComponent(FinanceLayout);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
