import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FieldSelector } from './field-selector';

describe('FieldSelector', () => {
  let component: FieldSelector;
  let fixture: ComponentFixture<FieldSelector>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FieldSelector],
    }).compileComponents();

    fixture = TestBed.createComponent(FieldSelector);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
