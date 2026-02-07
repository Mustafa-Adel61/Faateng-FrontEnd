import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TechnicianLayout } from './technician-layout';

describe('TechnicianLayout', () => {
  let component: TechnicianLayout;
  let fixture: ComponentFixture<TechnicianLayout>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TechnicianLayout]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TechnicianLayout);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
