import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AnalyticsWidget } from './analytics-widget';

describe('AnalyticsWidget', () => {
  let component: AnalyticsWidget;
  let fixture: ComponentFixture<AnalyticsWidget>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AnalyticsWidget],
    }).compileComponents();

    fixture = TestBed.createComponent(AnalyticsWidget);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
