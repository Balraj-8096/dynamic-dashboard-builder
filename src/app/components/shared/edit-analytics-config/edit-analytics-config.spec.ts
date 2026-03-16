import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EditAnalyticsConfig } from './edit-analytics-config';

describe('EditAnalyticsConfig', () => {
  let component: EditAnalyticsConfig;
  let fixture: ComponentFixture<EditAnalyticsConfig>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EditAnalyticsConfig],
    }).compileComponents();

    fixture = TestBed.createComponent(EditAnalyticsConfig);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
