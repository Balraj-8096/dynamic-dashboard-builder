import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BarWidget } from './bar-widget';

describe('BarWidget', () => {
  let component: BarWidget;
  let fixture: ComponentFixture<BarWidget>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BarWidget],
    }).compileComponents();

    fixture = TestBed.createComponent(BarWidget);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
