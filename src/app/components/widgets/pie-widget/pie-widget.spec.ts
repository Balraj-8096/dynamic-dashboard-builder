import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PieWidget } from './pie-widget';

describe('PieWidget', () => {
  let component: PieWidget;
  let fixture: ComponentFixture<PieWidget>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PieWidget],
    }).compileComponents();

    fixture = TestBed.createComponent(PieWidget);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
