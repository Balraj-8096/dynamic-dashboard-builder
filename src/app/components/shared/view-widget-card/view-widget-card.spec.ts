import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ViewWidgetCard } from './view-widget-card';

describe('ViewWidgetCard', () => {
  let component: ViewWidgetCard;
  let fixture: ComponentFixture<ViewWidgetCard>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ViewWidgetCard],
    }).compileComponents();

    fixture = TestBed.createComponent(ViewWidgetCard);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
