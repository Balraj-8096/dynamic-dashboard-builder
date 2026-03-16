import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EditTableConfig } from './edit-table-config';

describe('EditTableConfig', () => {
  let component: EditTableConfig;
  let fixture: ComponentFixture<EditTableConfig>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EditTableConfig],
    }).compileComponents();

    fixture = TestBed.createComponent(EditTableConfig);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
