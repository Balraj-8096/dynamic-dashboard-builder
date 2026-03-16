import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EditProgressConfig } from './edit-progress-config';

describe('EditProgressConfig', () => {
  let component: EditProgressConfig;
  let fixture: ComponentFixture<EditProgressConfig>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EditProgressConfig],
    }).compileComponents();

    fixture = TestBed.createComponent(EditProgressConfig);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
