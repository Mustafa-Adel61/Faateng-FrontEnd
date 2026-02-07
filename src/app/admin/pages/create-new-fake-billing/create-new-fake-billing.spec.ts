import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CreateNewFakeBilling } from './create-new-fake-billing';

describe('CreateNewFakeBilling', () => {
  let component: CreateNewFakeBilling;
  let fixture: ComponentFixture<CreateNewFakeBilling>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CreateNewFakeBilling]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CreateNewFakeBilling);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
