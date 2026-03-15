import { ComponentFixture, TestBed } from '@angular/core/testing';

import { HelpModal } from './help-modal';

describe('HelpModal', () => {
  let component: HelpModal;
  let fixture: ComponentFixture<HelpModal>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HelpModal],
    }).compileComponents();

    fixture = TestBed.createComponent(HelpModal);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
