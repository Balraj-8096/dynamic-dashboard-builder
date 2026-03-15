import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ProgressWidget } from './progress-widget';

describe('ProgressWidget', () => {
  let component: ProgressWidget;
  let fixture: ComponentFixture<ProgressWidget>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ProgressWidget],
    }).compileComponents();

    fixture = TestBed.createComponent(ProgressWidget);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
