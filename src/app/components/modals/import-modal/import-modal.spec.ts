import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ImportModal } from './import-modal';

describe('ImportModal', () => {
  let component: ImportModal;
  let fixture: ComponentFixture<ImportModal>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ImportModal],
    }).compileComponents();

    fixture = TestBed.createComponent(ImportModal);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
