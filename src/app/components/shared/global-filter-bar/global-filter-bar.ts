// ═══════════════════════════════════════════════════════════════
//  DASHCRAFT — Global Filter Bar
//  Dashboard-level filters that apply to all query widgets.
//  Reads GlobalFilterDimension config from the active product
//  and writes FilterCondition[] to QueryService.globalFilters.
// ═══════════════════════════════════════════════════════════════

import {
  Component,
  ChangeDetectionStrategy,
  inject,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { DashboardService } from '../../../services/dashboard.service';
import { QueryService }     from '../../../services/query.service';
import {
  GlobalFilterDimension,
  GlobalFilterType,
  FilterCondition,
  FilterOperator,
  DateRangePreset,
} from '../../../core/query-types';

@Component({
  selector: 'app-global-filter-bar',
  imports: [CommonModule, FormsModule],
  templateUrl: './global-filter-bar.html',
  styleUrl: './global-filter-bar.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GlobalFilterBarComponent {

  private readonly svc  = inject(DashboardService);
  private readonly qsvc = inject(QueryService);

  protected readonly GlobalFilterType = GlobalFilterType;

  // ── Reactive product signal ──────────────────────────────────
  protected readonly product = this.svc.activeProduct;

  // ── Filter state ─────────────────────────────────────────────
  /** site_key → selected value ('' = all) */
  siteSelections: Record<string, string> = {};
  /** date_key → selected preset ('' = all time) */
  datePresets: Record<string, string> = {};

  protected get dimensions(): GlobalFilterDimension[] {
    const p = this.product();
    return p ? this.qsvc.getGlobalFilterDimensions(p) : [];
  }

  protected dimKey(dim: GlobalFilterDimension): string {
    return `${dim.entity}.${dim.field}`;
  }

  protected siteValues(dim: GlobalFilterDimension): string[] {
    const p = this.product();
    return p ? this.qsvc.getDistinctValues(p, dim.entity, dim.field) : [];
  }

  protected get hasActiveFilters(): boolean {
    return Object.values(this.siteSelections).some(v => !!v) ||
           Object.values(this.datePresets).some(v => !!v);
  }

  protected readonly presetOptions: { value: string; label: string }[] = [
    { value: DateRangePreset.Today,      label: 'Today'       },
    { value: DateRangePreset.Yesterday,  label: 'Yesterday'   },
    { value: DateRangePreset.Last7Days,  label: 'Last 7 days' },
    { value: DateRangePreset.Last30Days, label: 'Last 30 days'},
    { value: DateRangePreset.Last90Days, label: 'Last 90 days'},
    { value: DateRangePreset.ThisMonth,  label: 'This month'  },
    { value: DateRangePreset.LastMonth,  label: 'Last month'  },
    { value: DateRangePreset.ThisYear,   label: 'This year'   },
    { value: DateRangePreset.LastYear,   label: 'Last year'   },
  ];

  // ── Filter application ───────────────────────────────────────

  protected onFilterChange(): void {
    const filters: FilterCondition[] = [];

    for (const [key, val] of Object.entries(this.siteSelections)) {
      if (!val) continue;
      const [entity, field] = key.split('.');
      filters.push({ entity, field, operator: FilterOperator.Eq, value: val });
    }

    for (const [key, preset] of Object.entries(this.datePresets)) {
      if (!preset) continue;
      const [entity, field] = key.split('.');
      const label = this.presetOptions.find(p => p.value === preset)?.label;
      filters.push({
        entity, field,
        operator: FilterOperator.DateRange,
        dateRange: { preset: preset as DateRangePreset },
        label,
      });
    }

    this.qsvc.setGlobalFilters(filters);
  }

  protected clearFilters(): void {
    this.siteSelections = {};
    this.datePresets    = {};
    this.qsvc.clearGlobalFilters();
  }
}
