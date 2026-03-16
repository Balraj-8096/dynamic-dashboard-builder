import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EditStatConfig } from './edit-stat-config';

describe('EditStatConfig', () => {
  let component: EditStatConfig;
  let fixture: ComponentFixture<EditStatConfig>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EditStatConfig],
    }).compileComponents();

    fixture = TestBed.createComponent(EditStatConfig);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
