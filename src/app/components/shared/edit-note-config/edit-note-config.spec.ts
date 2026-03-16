import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EditNoteConfig } from './edit-note-config';

describe('EditNoteConfig', () => {
  let component: EditNoteConfig;
  let fixture: ComponentFixture<EditNoteConfig>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EditNoteConfig],
    }).compileComponents();

    fixture = TestBed.createComponent(EditNoteConfig);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
