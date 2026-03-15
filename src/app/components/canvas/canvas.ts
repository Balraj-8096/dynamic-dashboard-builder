
import {
  Component,
  OnInit,
  OnDestroy,
  AfterViewInit,
  ViewChild,
  ElementRef,
  inject,
  effect,
  ChangeDetectionStrategy,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

import {
  fromEvent,
  Subject,
  takeUntil,
} from 'rxjs';

import { DashboardService } from '../../services/dashboard.service';
import { Widget } from '../../core/interfaces';
import { gridToPixel } from '../../core/layout.utils';
import { COLS } from '../../core/constants';
import { WidgetCard } from "../widget-card/widget-card";

@Component({
  selector: 'app-canvas',
  imports: [CommonModule, WidgetCard],
  templateUrl: './canvas.html',
  styleUrl: './canvas.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Canvas implements OnInit, AfterViewInit, OnDestroy {
  // ── Injections ──────────────────────────────────────────────
  readonly svc = inject(DashboardService);
  private router = inject(Router);

  // ── Template refs ────────────────────────────────────────────
  @ViewChild('mainRef') mainRef!: ElementRef<HTMLDivElement>;
  @ViewChild('canvasRef') canvasRef!: ElementRef<HTMLDivElement>;

  // ── RxJS cleanup ─────────────────────────────────────────────
  private destroy$ = new Subject<void>();

  // ── ResizeObserver ───────────────────────────────────────────
  private resizeObserver?: ResizeObserver;

  // ── Expose COLS for template ─────────────────────────────────
  readonly COLS = COLS;


  constructor() {
    // Scroll to newly added widget after DOM commit
    // Runs whenever widgets signal changes
    effect(() => {
      const widgets = this.svc.widgets();
      const pending = this.svc.pendingScrollId;

      if (!pending) return;

      // Find the pending widget
      const widget = widgets.find(w => w.id === pending);
      if (!widget || !this.mainRef?.nativeElement) return;

      // Clear pending flag — fires once only (C21 audit)
      this.svc.pendingScrollId = null;

      // Compute scroll target — centre widget in viewport
      const colW = this.svc.colW();
      const zoom = this.svc.zoom();
      const px = gridToPixel(widget, colW);
      const scaledTop = px.top * zoom;
      const viewH = this.mainRef.nativeElement.clientHeight;
      const widgetH = px.height * zoom;
      const target = Math.max(
        0,
        scaledTop - (viewH - widgetH) / 2
      );

      this.mainRef.nativeElement.scrollTo({
        top: target,
        behavior: 'smooth',
      });

      this.svc.setScrollTop(target);
    });
  }


  ngOnInit(): void { }


  ngAfterViewInit(): void {
    this.setupResizeObserver();
    this.setupScrollListener();
    this.setupZoomListener();
  }


  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.resizeObserver?.disconnect();
  }


  // ── ResizeObserver ───────────────────────────────────────────

  /**
   * Watch canvas container width and update canvasW signal.
   * Re-fires when returning from View mode (page signal changes).
   * Includes rAF delay for layout settle (bug fix #14 React source).
   */
  private setupResizeObserver(): void {
    if (!this.canvasRef?.nativeElement) return;

    this.resizeObserver = new ResizeObserver(entries => {
      const width = entries[0]?.contentRect.width;
      if (width) {
        // rAF ensures layout has settled before measuring
        requestAnimationFrame(() => {
          this.svc.setCanvasW(width);
        });
      }
    });

    this.resizeObserver.observe(this.canvasRef.nativeElement);

    // Immediate measurement
    requestAnimationFrame(() => {
      const w = this.canvasRef.nativeElement.offsetWidth;
      if (w) this.svc.setCanvasW(w);
    });
  }


  // ── Scroll listener ──────────────────────────────────────────

  /**
   * Track scroll position reactively.
   * Updates scrollTop signal for minimap viewport rect.
   * NOT read from DOM at render time (bug fix #11 React source).
   */
  private setupScrollListener(): void {
    if (!this.mainRef?.nativeElement) return;

    fromEvent(this.mainRef.nativeElement, 'scroll')
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.svc.setScrollTop(
          this.mainRef.nativeElement.scrollTop
        );
      });
  }


  // ── Zoom listener ────────────────────────────────────────────

  /**
   * Ctrl+scroll to zoom canvas.
   * Uses passive: false to allow preventDefault.
   * RxJS fromEvent with options via addEventListener directly.
   */
  private setupZoomListener(): void {
    if (!this.mainRef?.nativeElement) return;

    const el = this.mainRef.nativeElement;

    const onWheel = (e: WheelEvent) => {
      if (!e.ctrlKey) return;
      e.preventDefault();
      this.svc.setZoom(
        this.svc.zoom() - e.deltaY * 0.001
      );
    };

    // Must use addEventListener directly for passive:false
    el.addEventListener('wheel', onWheel, { passive: false });

    // Clean up on destroy
    this.destroy$.pipe(
      takeUntil(this.destroy$)
    ).subscribe(() => {
      el.removeEventListener('wheel', onWheel);
    });
  }


  // ── Canvas click ─────────────────────────────────────────────

  /**
   * Click on canvas background:
   * - Deselects any selected widget
   * - Closes context menu
   */
  onCanvasClick(): void {
    this.svc.select(null);
    this.svc.closeContextMenu();
  }


  // ── View mode navigation ─────────────────────────────────────

  /**
   * Navigate to view mode.
   * Disabled when no widgets on canvas.
   */
  goToView(): void {
    if (this.svc.widgetCount() === 0) return;
    this.router.navigate(['/view']);
  }


  // ── Template helpers ─────────────────────────────────────────

  /**
   * TrackBy function for widget ngFor loop.
   * Prevents full re-render when only one widget changes.
   */
  trackByWidget(_: number, widget: Widget): string {
    return widget.id;
  }

  /**
   * Get pixel rect for a widget.
   * Called by template for each widget card positioning.
   */
  getPixelRect(widget: Widget) {
    return gridToPixel(widget, this.svc.colW());
  }

  /**
   * Get snap guide column positions during drag.
   * Returns array of column x positions for visual guides.
   */
  getSnapGuidePositions(): number[] {
    return Array.from({ length: this.COLS }, (_, i) => i);
  }
}
