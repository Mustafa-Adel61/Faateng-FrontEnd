import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CreateNewBilling } from './create-new-billing';

describe('CreateNewBilling', () => {
  let component: CreateNewBilling;
  let fixture: ComponentFixture<CreateNewBilling>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CreateNewBilling]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CreateNewBilling);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
