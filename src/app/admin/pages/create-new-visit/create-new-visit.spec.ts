import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CreateNewVisit } from './create-new-visit';

describe('CreateNewVisit', () => {
  let component: CreateNewVisit;
  let fixture: ComponentFixture<CreateNewVisit>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CreateNewVisit]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CreateNewVisit);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
