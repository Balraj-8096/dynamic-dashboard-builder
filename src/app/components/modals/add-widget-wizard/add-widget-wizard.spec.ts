import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AddWidgetWizard } from './add-widget-wizard';

describe('AddWidgetWizard', () => {
  let component: AddWidgetWizard;
  let fixture: ComponentFixture<AddWidgetWizard>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AddWidgetWizard],
    }).compileComponents();

    fixture = TestBed.createComponent(AddWidgetWizard);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
