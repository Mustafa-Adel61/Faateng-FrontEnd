import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FaultCodes } from './fault-codes';

describe('FaultCodes', () => {
  let component: FaultCodes;
  let fixture: ComponentFixture<FaultCodes>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FaultCodes]
    })
    .compileComponents();

    fixture = TestBed.createComponent(FaultCodes);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
