import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ProposalGenerator } from './proposal-generator';

describe('ProposalGenerator', () => {
  let component: ProposalGenerator;
  let fixture: ComponentFixture<ProposalGenerator>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ProposalGenerator]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ProposalGenerator);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
