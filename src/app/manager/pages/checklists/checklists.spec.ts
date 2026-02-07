import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Checklists } from './checklists';

describe('Checklists', () => {
  let component: Checklists;
  let fixture: ComponentFixture<Checklists>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Checklists]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Checklists);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
