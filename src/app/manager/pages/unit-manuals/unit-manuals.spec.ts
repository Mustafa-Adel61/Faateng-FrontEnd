import { ComponentFixture, TestBed } from '@angular/core/testing';

import { UnitManuals } from './unit-manuals';

describe('UnitManuals', () => {
  let component: UnitManuals;
  let fixture: ComponentFixture<UnitManuals>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [UnitManuals]
    })
    .compileComponents();

    fixture = TestBed.createComponent(UnitManuals);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
