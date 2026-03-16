import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EditSeriesConfig } from './edit-series-config';

describe('EditSeriesConfig', () => {
  let component: EditSeriesConfig;
  let fixture: ComponentFixture<EditSeriesConfig>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EditSeriesConfig],
    }).compileComponents();

    fixture = TestBed.createComponent(EditSeriesConfig);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
