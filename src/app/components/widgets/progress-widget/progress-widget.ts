
// ═══════════════════════════════════════════════════════════════
//  DASHCRAFT — Progress Bars Widget
//  Multi-metric progress display with glow effects
// ═══════════════════════════════════════════════════════════════

import {
  Component,
  Input,
  OnChanges,
  OnDestroy,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  effect,
  untracked,
  inject,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subject, Subscription, forkJoin } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

import { ProgressColorRule, ProgressConfig, ProgressItem, Widget } from '../../../core/interfaces';
import { QUERY_SERVICE_TOKEN }   from '../../../core/query-service.interface';
import { mapProgressResults }    from '../../../core/query-result-mapper';

@Component({
  selector: 'app-progress-widget',
  imports: [CommonModule],
  templateUrl: './progress-widget.html',
  styleUrl: './progress-widget.scss',
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProgressWidget implements OnChanges, OnDestroy {

  @Input({ required: true }) widget!: Widget;
  @Input() contentH: number = 200;

  private readonly qsvc = inject(QUERY_SERVICE_TOKEN);
  private readonly cdr  = inject(ChangeDetectorRef);

  /** Cancels the in-flight forkJoin subscription when a new refresh begins. */
  private refreshSub?: Subscription;
  /** Completes all subscriptions on component destroy. */
  private readonly destroy$ = new Subject<void>();

  isLoading = false;

  private _displayItems: ProgressItem[] | null = null;

  constructor() {
    effect(() => {
      this.qsvc.globalFilters();
      untracked(() => { if (this.widget) { this.refresh(); this.cdr.markForCheck(); } });
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  get cfg(): ProgressConfig {
    return this.widget.config as ProgressConfig;
  }

  get items(): ProgressItem[] {
    return this._displayItems ?? this.cfg?.items ?? [];
  }

  ngOnChanges(): void { this.refresh(); }

  private refresh(): void {
    const queries   = this.cfg?.progressQueries;
    const baseItems = this.cfg?.items ?? [];

    if (queries?.length && baseItems.length) {
      // Cancel any previous in-flight request before starting a new one.
      this.refreshSub?.unsubscribe();

      // forkJoin fires all stat queries in parallel and waits for all to complete.
      this.isLoading = true;
      this.refreshSub = forkJoin(queries.map(q => this.qsvc.executeStatQuery(q)))
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: results => {
            this._displayItems = mapProgressResults(results, baseItems);
            this.isLoading = false;
            this.cdr.markForCheck();
          },
          error: () => {
            this._displayItems = null;
            this.isLoading = false;
            this.cdr.markForCheck();
          },
        });
    } else {
      this._displayItems = null;
    }
  }

  getPercent(item: ProgressItem): number {
    return Math.min(100, Math.round((item.value / item.max) * 100));
  }

  // ── E6: color rule resolver ───────────────────────────────────
  /**
   * Returns the bar fill color after evaluating global color rules.
   * Rules are sorted descending by minPercent — highest matching rule wins.
   * Falls back to item.color (existing behaviour) when:
   *   - cfg.colorRules is absent or empty (all existing widgets)
   *   - no rule matches the current percentage
   */
  resolveItemColor(item: ProgressItem): string {
    const rules = this.cfg?.colorRules;
    if (!rules?.length) return item.color;
    const pct = this.getPercent(item);
    const matched = [...rules]
      .sort((a: ProgressColorRule, b: ProgressColorRule) => b.minPercent - a.minPercent)
      .find((r: ProgressColorRule) => pct >= r.minPercent);
    return matched?.color ?? item.color;
  }
}
