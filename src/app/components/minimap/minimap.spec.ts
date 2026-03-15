import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Minimap } from './minimap';

describe('Minimap', () => {
  let component: Minimap;
  let fixture: ComponentFixture<Minimap>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Minimap],
    }).compileComponents();

    fixture = TestBed.createComponent(Minimap);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
