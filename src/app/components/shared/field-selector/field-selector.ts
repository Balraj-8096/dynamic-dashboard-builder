import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, OnChanges, Output, SimpleChanges } from '@angular/core';
import { FIELD_POOL_MAP, DATA_SCHEMA, isMultiSelect } from '../../../core/data-schema';
import { WidgetType } from '../../../core/interfaces';

@Component({
  selector: 'app-field-selector',
  imports: [CommonModule],
  templateUrl: './field-selector.html',
  styleUrl: './field-selector.scss',
})
export class FieldSelector implements OnChanges {
  @Input({ required: true }) type!: WidgetType;
  @Input({ required: true }) selectedFields!: string[];
  @Output() selectedFieldsChange = new EventEmitter<string[]>();

  poolMap: any = null;
  pool: any[] = [];
  grouped: Record<string, any[]> | null = null;
  multi = true;

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['type']) {
      this.poolMap = FIELD_POOL_MAP[this.type] ?? null;
      this.pool = this.poolMap ? (DATA_SCHEMA as any)[this.poolMap.pool] : [];
      this.multi = isMultiSelect(this.type);

      // Group KPI fields by category
      if (this.poolMap?.pool === 'kpi') {
        this.grouped = this.pool.reduce((acc: any, f: any) => {
          (acc[f.category] = acc[f.category] || []).push(f);
          return acc;
        }, {});
      } else {
        this.grouped = null;
      }
    }
  }

  get groupEntries(): [string, any[]][] {
    return this.grouped ? Object.entries(this.grouped) : [];
  }

  get selectionCount(): number { return this.selectedFields.length; }
  get poolCount(): number { return this.pool.length; }

  isSelected(id: string): boolean {
    return this.selectedFields.includes(id);
  }

  toggle(id: string): void {
    if (!this.multi) {
      this.selectedFieldsChange.emit([id]);
      return;
    }
    if (this.isSelected(id)) {
      this.selectedFieldsChange.emit(this.selectedFields.filter(x => x !== id));
    } else {
      this.selectedFieldsChange.emit([...this.selectedFields, id]);
    }
  }

  selectAll(): void {
    this.selectedFieldsChange.emit(this.pool.map((f: any) => f.id));
  }

  clearAll(): void {
    this.selectedFieldsChange.emit([]);
  }

  // Helper to get accent for a field (kpi uses field.accent, others use field.color)
  fieldAccent(f: any): string | null {
    return f.accent || f.color || null;
  }
}
