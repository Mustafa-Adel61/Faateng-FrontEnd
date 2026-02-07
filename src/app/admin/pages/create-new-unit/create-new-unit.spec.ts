import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CreateNewUnit } from './create-new-unit';

describe('CreateNewUnit', () => {
  let component: CreateNewUnit;
  let fixture: ComponentFixture<CreateNewUnit>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CreateNewUnit]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CreateNewUnit);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
