import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DispatcherView } from './dispatcher-view';

describe('DispatcherView', () => {
  let component: DispatcherView;
  let fixture: ComponentFixture<DispatcherView>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DispatcherView]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DispatcherView);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
