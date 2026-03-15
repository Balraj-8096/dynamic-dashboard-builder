// ═══════════════════════════════════════════════════════════════
//  DASHCRAFT — Widget Card Component
//  Interactive wrapper rendered once per widget on the canvas
//
//  Responsibilities:
//  ├── Absolute positioning via gridToPixel()
//  ├── Widget header (icon, title, type badge, action buttons)
//  ├── Drag handle (mousedown on header)
//  ├── Three resize handles (right, bottom, SE corner)
//  ├── Lock badge + locked visual state
//  ├── Selected / active / front / animating visual states
//  ├── Right-click context menu trigger
//  └── Content area (widget content component goes here Step 18+)
// ═══════════════════════════════════════════════════════════════

import {
  Component,
  Input,
  OnInit,
  OnDestroy,
  inject,
  computed,
  signal,
  ChangeDetectionStrategy,
  ElementRef,
  ViewChild,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subject, fromEvent, takeUntil } from 'rxjs';

import { DashboardService } from '../../services/dashboard.service';
import { Widget, ResizeDirection, PixelRect } from '../../core/interfaces';
import { gridToPixel } from '../../core/layout.utils';
import {
  resolveDrag,
  resolveResize,
} from '../../core/layout.utils';
import {
  COLS, ROW_H, GAP,
  MAX_WIDGET_H,
  clamp,
} from '../../core/constants';
import {
  getCatalogItem,
  getCatalogIcon,
  getCatalogColor,
} from '../../core/catalog';
import { StatWidget } from "../widgets/stat-widget/stat-widget";
import { AnalyticsWidget } from "../widgets/analytics-widget/analytics-widget";
import { BarWidget } from "../widgets/bar-widget/bar-widget";
import { LineWidget } from "../widgets/line-widget/line-widget";
import { PieWidget } from "../widgets/pie-widget/pie-widget";
import { ProgressWidget } from "../widgets/progress-widget/progress-widget";
import { TableWidget } from "../widgets/table-widget/table-widget";
import { NoteWidget } from "../widgets/note-widget/note-widget";
import { SectionWidget } from "../widgets/section-widget/section-widget";

@Component({
  selector: 'app-widget-card',
  imports: [CommonModule, StatWidget, AnalyticsWidget, BarWidget, LineWidget, PieWidget, ProgressWidget, TableWidget, NoteWidget, SectionWidget],
  templateUrl: './widget-card.html',
  styleUrl: './widget-card.scss',
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WidgetCard implements OnInit, OnDestroy {

  // ── Inputs ───────────────────────────────────────────────────
  @Input({ required: true }) widget!: Widget;

  // ── Injections ───────────────────────────────────────────────
  readonly svc = inject(DashboardService);

  // ── RxJS cleanup ─────────────────────────────────────────────
  private destroy$ = new Subject<void>();

  // ── Catalog helpers ──────────────────────────────────────────
  get catalogIcon():  string { return getCatalogIcon(this.widget.type);  }
  get catalogColor(): string { return getCatalogColor(this.widget.type); }
  get catalogLabel(): string {
    return getCatalogItem(this.widget.type)?.label ?? this.widget.type;
  }

  // ── Pixel rect ───────────────────────────────────────────────
  get pixelRect(): PixelRect {
    return gridToPixel(this.widget, this.svc.colW());
  }

  get contentH(): number {
    return this.pixelRect.height - 40; // HDR_H = 40
  }

  // ── State helpers ────────────────────────────────────────────
  get isSelected():  boolean {
    return this.svc.selectedId()  === this.widget.id &&
           this.svc.activeId()    !== this.widget.id;
  }

  get isActive(): boolean {
    return this.svc.activeId() === this.widget.id;
  }

  get isFront(): boolean {
    return this.svc.frontId()    === this.widget.id &&
           this.svc.activeId()   !== this.widget.id;
  }

  get isAnimating(): boolean {
    return this.svc.animatingId() === this.widget.id;
  }

  get isLocked(): boolean {
    return this.widget.locked === true;
  }


  ngOnInit(): void {}

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }


  // ─────────────────────────────────────────────────────────────
  //  DRAG
  // ─────────────────────────────────────────────────────────────

  /**
   * Start drag on header mousedown.
   * Left mouse button only (button === 0).
   * Locked widgets: select only, no drag.
   */
  onDragStart(e: MouseEvent): void {
    // Left button only (edge case C15)
    if (e.button !== 0) return;

    // Locked widget — select only, no drag
    if (this.widget.locked) {
      this.svc.select(this.widget.id);
      return;
    }

    e.preventDefault();

    const colW   = this.svc.colW();
    const widget = this.widget;

    // Snapshot drag origin
    const startX = e.clientX;
    const startY = e.clientY;
    const origX  = widget.x;
    const origY  = widget.y;

    // Set active state
    this.svc.setActive(widget.id);
    this.svc.select(widget.id);

    // ── Mousemove handler ──────────────────────────────────
    const onMove = (mv: MouseEvent) => {
      // Compute grid delta from pixel delta
      const nx = clamp(
        origX + Math.round((mv.clientX - startX) / (colW + GAP)),
        0,
        COLS - 1
      );
      const ny = clamp(
        origY + Math.round((mv.clientY - startY) / (ROW_H + GAP)),
        0,
        50
      );

      // Get current active widget from service
      const current = this.svc.widgets()
        .find(w => w.id === widget.id);
      if (!current) return;

      // Clamp x so widget doesn't overflow right edge
      const clampedX  = clamp(nx, 0, COLS - current.w);
      const resolved  = resolveDrag(
        current,
        clampedX,
        ny,
        this.svc.widgets()
      );

      if (resolved) {
        this.svc.setWidgetPositions(resolved);
      }
    };

    // ── Mouseup handler ────────────────────────────────────
    const onUp = () => {
      // Commit to history on mouseup (C11 audit)
      this.svc.commitDragResize();

      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup',   onUp);
    };

    // Document-level listeners (C11 audit — not canvas element)
    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup',   onUp);
  }


  // ─────────────────────────────────────────────────────────────
  //  RESIZE
  // ─────────────────────────────────────────────────────────────

  /**
   * Start resize on handle mousedown.
   * Left button only.
   * Locked widgets — resize handles are hidden in template.
   */
  onResizeStart(e: MouseEvent, dir: ResizeDirection): void {
    // Left button only (C15)
    if (e.button !== 0) return;
    if (this.widget.locked) return;

    e.preventDefault();
    e.stopPropagation(); // prevent drag from starting

    const colW   = this.svc.colW();
    const widget = this.widget;

    const startX = e.clientX;
    const startY = e.clientY;
    const origW  = widget.w;
    const origH  = widget.h;

    // Set active state
    this.svc.setActive(widget.id);

    // ── Mousemove handler ──────────────────────────────────
    const onMove = (mv: MouseEvent) => {
      const dcols = Math.round((mv.clientX - startX) / (colW + GAP));
      const drows = Math.round((mv.clientY - startY) / (ROW_H + GAP));

      // Compute new dimensions
      const nw = dir.includes('e')
        ? clamp(origW + dcols, 1, COLS)
        : origW;
      const nh = dir.includes('s')
        ? clamp(origH + drows, 1, MAX_WIDGET_H)
        : origH;

      const current = this.svc.widgets()
        .find(w => w.id === widget.id);
      if (!current) return;

      // Clamp width — can't overflow right edge (C16)
      const maxW     = COLS - current.x;
      const resolved = resolveResize(
        current,
        clamp(nw, 1, maxW),
        nh,
        dir,
        this.svc.widgets()
      );

      if (resolved) {
        this.svc.setWidgetPositions(resolved);
      }
    };

    // ── Mouseup handler ────────────────────────────────────
    const onUp = () => {
      this.svc.commitDragResize();
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup',   onUp);
    };

    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup',   onUp);
  }


  // ─────────────────────────────────────────────────────────────
  //  ACTIONS
  // ─────────────────────────────────────────────────────────────

  /** Select this widget on click. */
  onCardClick(e: MouseEvent): void {
    e.stopPropagation();
    this.svc.select(this.widget.id);
  }

  /** Open right-click context menu. */
  onContextMenu(e: MouseEvent): void {
    e.preventDefault();
    e.stopPropagation();
    this.svc.openContextMenu(
      this.widget.id,
      e.clientX,
      e.clientY
    );
  }

  /** Open edit modal. */
  onEdit(e: MouseEvent): void {
    e.stopPropagation();
    this.svc.openEditModal(this.widget);
  }

  /** Duplicate this widget. */
  onDuplicate(e: MouseEvent): void {
    e.stopPropagation();
    this.svc.duplicateWidget(this.widget);
  }

  /** Delete this widget. */
  onDelete(e: MouseEvent): void {
    e.stopPropagation();
    this.svc.deleteWidget(this.widget.id);
  }

  /** Toggle lock on this widget. */
  onLock(e: MouseEvent): void {
    e.stopPropagation();
    this.svc.lockWidget(this.widget.id);
  }

  /** Bring this widget to front. */
  onBringFront(e: MouseEvent): void {
    e.stopPropagation();
    this.svc.bringFront(this.widget.id);
  }
}
