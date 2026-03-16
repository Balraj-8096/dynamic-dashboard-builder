import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EditPieConfig } from './edit-pie-config';

describe('EditPieConfig', () => {
  let component: EditPieConfig;
  let fixture: ComponentFixture<EditPieConfig>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EditPieConfig],
    }).compileComponents();

    fixture = TestBed.createComponent(EditPieConfig);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
