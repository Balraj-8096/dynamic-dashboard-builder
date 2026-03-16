import { ComponentFixture, TestBed } from '@angular/core/testing';

import { WidgetMiniPreview } from './widget-mini-preview';

describe('WidgetMiniPreview', () => {
  let component: WidgetMiniPreview;
  let fixture: ComponentFixture<WidgetMiniPreview>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [WidgetMiniPreview],
    }).compileComponents();

    fixture = TestBed.createComponent(WidgetMiniPreview);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
