import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Dispatcher } from './dispatcher';

describe('Dispatcher', () => {
  let component: Dispatcher;
  let fixture: ComponentFixture<Dispatcher>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Dispatcher]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Dispatcher);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
