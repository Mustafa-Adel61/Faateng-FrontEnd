import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FaultCode } from './fault-code';

describe('FaultCode', () => {
  let component: FaultCode;
  let fixture: ComponentFixture<FaultCode>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FaultCode]
    })
    .compileComponents();

    fixture = TestBed.createComponent(FaultCode);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
