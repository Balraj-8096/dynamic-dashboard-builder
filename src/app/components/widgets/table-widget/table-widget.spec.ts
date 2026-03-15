import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TableWidget } from './table-widget';

describe('TableWidget', () => {
  let component: TableWidget;
  let fixture: ComponentFixture<TableWidget>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TableWidget],
    }).compileComponents();

    fixture = TestBed.createComponent(TableWidget);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
