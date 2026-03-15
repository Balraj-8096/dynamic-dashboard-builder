import { ComponentFixture, TestBed } from '@angular/core/testing';

import { NoteWidget } from './note-widget';

describe('NoteWidget', () => {
  let component: NoteWidget;
  let fixture: ComponentFixture<NoteWidget>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [NoteWidget],
    }).compileComponents();

    fixture = TestBed.createComponent(NoteWidget);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
