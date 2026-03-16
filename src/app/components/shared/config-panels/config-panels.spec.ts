import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ConfigPanels } from './config-panels';

describe('ConfigPanels', () => {
  let component: ConfigPanels;
  let fixture: ComponentFixture<ConfigPanels>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ConfigPanels],
    }).compileComponents();

    fixture = TestBed.createComponent(ConfigPanels);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
