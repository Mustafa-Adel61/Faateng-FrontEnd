import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CreateNewProject } from './create-new-project';

describe('CreateNewProject', () => {
  let component: CreateNewProject;
  let fixture: ComponentFixture<CreateNewProject>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CreateNewProject]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CreateNewProject);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
