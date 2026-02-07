import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CreateNewContact } from './create-new-contact';

describe('CreateNewContact', () => {
  let component: CreateNewContact;
  let fixture: ComponentFixture<CreateNewContact>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CreateNewContact]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CreateNewContact);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
