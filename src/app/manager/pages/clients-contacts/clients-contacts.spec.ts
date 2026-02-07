import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ClientsContacts } from './clients-contacts';

describe('ClientsContacts', () => {
  let component: ClientsContacts;
  let fixture: ComponentFixture<ClientsContacts>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ClientsContacts]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ClientsContacts);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
