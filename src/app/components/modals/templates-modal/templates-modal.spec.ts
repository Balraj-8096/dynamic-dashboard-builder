import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TemplatesModal } from './templates-modal';

describe('TemplatesModal', () => {
  let component: TemplatesModal;
  let fixture: ComponentFixture<TemplatesModal>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TemplatesModal],
    }).compileComponents();

    fixture = TestBed.createComponent(TemplatesModal);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
