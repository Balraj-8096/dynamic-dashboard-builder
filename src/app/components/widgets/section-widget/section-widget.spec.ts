import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SectionWidget } from './section-widget';

describe('SectionWidget', () => {
  let component: SectionWidget;
  let fixture: ComponentFixture<SectionWidget>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SectionWidget],
    }).compileComponents();

    fixture = TestBed.createComponent(SectionWidget);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
