import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LineWidget } from './line-widget';

describe('LineWidget', () => {
  let component: LineWidget;
  let fixture: ComponentFixture<LineWidget>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LineWidget],
    }).compileComponents();

    fixture = TestBed.createComponent(LineWidget);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
