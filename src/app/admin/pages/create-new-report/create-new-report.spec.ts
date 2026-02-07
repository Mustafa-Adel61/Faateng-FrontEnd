import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CreateNewReport } from './create-new-report';

describe('CreateNewReport', () => {
  let component: CreateNewReport;
  let fixture: ComponentFixture<CreateNewReport>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CreateNewReport]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CreateNewReport);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
