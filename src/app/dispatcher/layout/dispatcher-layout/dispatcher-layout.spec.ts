import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DispatcherLayout } from './dispatcher-layout';

describe('DispatcherLayout', () => {
  let component: DispatcherLayout;
  let fixture: ComponentFixture<DispatcherLayout>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DispatcherLayout]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DispatcherLayout);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
