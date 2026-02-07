import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SharedServiceRequestes } from './shared-service-requestes';

describe('SharedServiceRequestes', () => {
  let component: SharedServiceRequestes;
  let fixture: ComponentFixture<SharedServiceRequestes>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SharedServiceRequestes]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SharedServiceRequestes);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
