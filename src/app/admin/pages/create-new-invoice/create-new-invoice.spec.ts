import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CreateNewInvoice } from './create-new-invoice';

describe('CreateNewInvoice', () => {
  let component: CreateNewInvoice;
  let fixture: ComponentFixture<CreateNewInvoice>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CreateNewInvoice]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CreateNewInvoice);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
