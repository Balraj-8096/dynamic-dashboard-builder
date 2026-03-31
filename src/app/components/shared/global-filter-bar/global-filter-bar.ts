// ═══════════════════════════════════════════════════════════════
//  DASHCRAFT — Global Filter Bar
//  Dashboard-level filters that apply to all query widgets.
//  Reads GlobalFilterDimension config from the active product
//  and writes FilterCondition[] to the query service facade.
// ═══════════════════════════════════════════════════════════════

import {
  Component,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  OnDestroy,
  effect,
  untracked,
  inject,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject, Subscription } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

import { DashboardService }    from '../../../services/dashboard.service';
import { QUERY_SERVICE_TOKEN } from '../../../core/query-service.interface';
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
export class GlobalFilterBarComponent implements OnDestroy {

  private readonly svc  = inject(DashboardService);
  private readonly qsvc = inject(QUERY_SERVICE_TOKEN);
  private readonly cdr  = inject(ChangeDetectorRef);

  /** Completes all subscriptions on component destroy. */
  private readonly destroy$ = new Subject<void>();
  /** Cancels in-flight dimension load when product changes. */
  private dimSub?: Subscription;
  /** Cancels in-flight distinct-value loads when dimensions change. */
  private valuesSubs: Subscription[] = [];

  protected readonly GlobalFilterType = GlobalFilterType;

  // ── Reactive product signal ──────────────────────────────────
  protected readonly product = this.svc.activeProduct;

  // ── Loaded schema state ──────────────────────────────────────
  /** Dimensions for the active product — loaded asynchronously. */
  protected dimensions: GlobalFilterDimension[] = [];
  /** Cache of distinct values per dimension key (entity.field). */
  private valuesCache: Record<string, string[]> = {};

  constructor() {
    // React to product changes — reload dimensions and clear filter state.
    effect(() => {
      const p = this.product();
      untracked(() => this.loadDimensions(p));
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // ── Filter state ─────────────────────────────────────────────
  /** site_key → selected value ('' = all) */
  siteSelections: Record<string, string> = {};
  /** date_key → selected preset ('' = all time) */
  datePresets: Record<string, string> = {};

  protected dimKey(dim: GlobalFilterDimension): string {
    return `${dim.entity}.${dim.field}`;
  }

  /** Returns cached distinct values for a site dimension. */
  protected siteValues(dim: GlobalFilterDimension): string[] {
    return this.valuesCache[this.dimKey(dim)] ?? [];
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

  // ── Async dimension + values loading ─────────────────────────

  private loadDimensions(product: string | null | undefined): void {
    // Cancel previous loads.
    this.dimSub?.unsubscribe();
    this.valuesSubs.forEach(s => s.unsubscribe());
    this.valuesSubs = [];

    if (!product) {
      this.dimensions   = [];
      this.valuesCache  = {};
      this.siteSelections = {};
      this.datePresets    = {};
      this.cdr.markForCheck();
      return;
    }

    this.dimSub = this.qsvc.getGlobalFilterDimensions(product)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: dims => {
          this.dimensions  = dims;
          this.valuesCache = {};
          // Pre-load distinct values for every site-type dimension.
          for (const dim of dims) {
            if (dim.type === GlobalFilterType.Site) {
              this.loadDistinctValues(product, dim);
            }
          }
          this.cdr.markForCheck();
        },
        error: () => {
          this.dimensions = [];
          this.cdr.markForCheck();
        },
      });
  }

  private loadDistinctValues(product: string, dim: GlobalFilterDimension): void {
    const key = this.dimKey(dim);
    const sub = this.qsvc.getDistinctValues(product, dim.entity, dim.field)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: values => {
          this.valuesCache = { ...this.valuesCache, [key]: values };
          this.cdr.markForCheck();
        },
        error: () => {
          this.valuesCache = { ...this.valuesCache, [key]: [] };
        },
      });
    this.valuesSubs.push(sub);
  }

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
