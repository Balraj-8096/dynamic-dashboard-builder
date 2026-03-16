import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EditSectionConfig } from './edit-section-config';

describe('EditSectionConfig', () => {
  let component: EditSectionConfig;
  let fixture: ComponentFixture<EditSectionConfig>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EditSectionConfig],
    }).compileComponents();

    fixture = TestBed.createComponent(EditSectionConfig);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
