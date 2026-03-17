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
  HDR_H,
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
export class WidgetCard implements OnDestroy {
  @Input({ required: true }) widget!: Widget;

  readonly RD = ResizeDirection;
 
  readonly svc = inject(DashboardService);
 
  // ── Derived from service signals ──────────────────────────────
  get pixelRect()   { return gridToPixel(this.widget, this.svc.colW()); }
  get contentH()    { return this.pixelRect.height - HDR_H; }
  get isSelected()  { return this.svc.selectedId()  === this.widget.id; }
  get isActive()    { return this.svc.activeId()     === this.widget.id; }
  get isFront()     { return this.svc.frontId()      === this.widget.id; }
  get isAnimating() { return this.svc.animatingId()  === this.widget.id; }
  get isLocked()    { return this.widget.locked; }
 
  get catalogItem() { return getCatalogItem(this.widget.type); }
  get catalogIcon()  { return this.catalogItem?.icon  ?? ''; }
  get catalogColor() { return this.catalogItem?.color ?? 'var(--acc)'; }
  get catalogLabel() { return this.catalogItem?.label ?? ''; }
 
  get zIndex(): number {
    if (this.isActive)    return 200;
    if (this.isSelected)  return 150;
    if (this.isFront)     return 100;
    return 1;
  }
 
  get posStyle(): Record<string, string> {
    const r = this.pixelRect;
    return {
      position: 'absolute',
      left:   r.left   + 'px',
      top:    r.top    + 'px',
      width:  r.width  + 'px',
      height: r.height + 'px',
      zIndex: String(this.zIndex),
    };
  }
 
  // ── Drag state ────────────────────────────────────────────────
  private dragRef: {
    id: string;
    startX: number; startY: number;
    origX: number;  origY: number;
  } | null = null;
 
  // Bound handlers stored so the same reference is passed to removeEventListener
  // Step 32: removeEventListener called on mouseup, not just ngOnDestroy
  private _dragMove!: (e: MouseEvent) => void;
  private _dragUp!:   (e: MouseEvent) => void;
 
  // ── Resize state ──────────────────────────────────────────────
  private resizeRef: {
    id: string; dir: ResizeDirection;
    startX: number; startY: number;
    origW: number;  origH: number;
  } | null = null;
 
  private _resizeMove!: (e: MouseEvent) => void;
  private _resizeUp!:   (e: MouseEvent) => void;
 
  // ── ngOnDestroy — safety net ──────────────────────────────────
  // Normally listeners are removed in onUp (mouseup), but if the component
  // is destroyed mid-drag (e.g. widget deleted while dragging), we clean up.
  ngOnDestroy(): void {
    this._removeDragListeners();
    this._removeResizeListeners();
  }
 
  // ── Card click (select) ───────────────────────────────────────
  onCardClick(e: MouseEvent): void {
    e.stopPropagation();
    this.svc.select(this.widget.id);
  }
 
  // ── Right-click (context menu) ────────────────────────────────
  onContextMenu(e: MouseEvent): void {
    e.preventDefault();
    e.stopPropagation();
    this.svc.openContextMenu(this.widget.id, e.clientX, e.clientY);
  }
 
  // ── Action buttons ────────────────────────────────────────────
  onEdit(e: MouseEvent): void {
    e.stopPropagation();
    this.svc.openEditModal(this.widget);
  }
 
  onDuplicate(e: MouseEvent): void {
    e.stopPropagation();
    this.svc.duplicateWidget(this.widget);
  }
 
  onLock(e: MouseEvent): void {
    e.stopPropagation();
    this.svc.lockWidget(this.widget.id);
  }
 
  onBringFront(e: MouseEvent): void {
    e.stopPropagation();
    this.svc.bringFront(this.widget.id);
  }
 
  onDelete(e: MouseEvent): void {
    e.stopPropagation();
    // A2: svc.deleteWidget ALWAYS clears selectedId/frontId/animatingId
    this.svc.deleteWidget(this.widget.id);
  }
 
  // ── Drag ──────────────────────────────────────────────────────
  onHeaderMousedown(e: MouseEvent): void {
    // C15: left button only
    if (e.button !== 0) return;
 
    e.stopPropagation();
    this.svc.select(this.widget.id);
 
    // Locked: select only, no drag
    if (this.widget.locked) return;
 
    e.preventDefault();
 
    this.dragRef = {
      id:     this.widget.id,
      startX: e.clientX,
      startY: e.clientY,
      origX:  this.widget.x,
      origY:  this.widget.y,
    };
    this.svc.setActive(this.widget.id);
 
    // A4: document.addEventListener (not canvas element)
    this._dragMove = (mv: MouseEvent) => this._onDragMove(mv);
    this._dragUp   = ()                => this._onDragUp();
    document.addEventListener('mousemove', this._dragMove);
    document.addEventListener('mouseup',   this._dragUp);
  }
 
  private _onDragMove(mv: MouseEvent): void {
    const ref = this.dragRef;
    if (!ref) return;
 
    const colW = this.svc.colW();
    const nx = clamp(ref.origX + Math.round((mv.clientX - ref.startX) / (colW + GAP)), 0, COLS - 1);
    const ny = clamp(ref.origY + Math.round((mv.clientY - ref.startY) / (ROW_H + GAP)), 0, 50);
 
    const widgets = this.svc.widgets();
    const active  = widgets.find(w => w.id === ref.id);
    if (!active) return;
 
    // Clamp x so widget doesn't overflow the right edge
    const clampedX = clamp(nx, 0, COLS - active.w);
    const proposed = { ...active, x: clampedX, y: ny };
 
    // resolveDrag: three-tier fallback (full → x-only → y-only → null)
    const resolved = resolveDrag(proposed, clampedX, ny, widgets);
    if (resolved) {
      this.svc.setWidgetPositions(resolved);
    }
    // null = all blocked by locked widget, stay put
  }
 
  private _onDragUp(): void {
    if (this.dragRef) {
      this.dragRef = null;
      this.svc.setActive(null);
      // C11: pushHistory on mouseup only — one entry per drag, no flood
      this.svc.commitDragResize();
    }
    // Step 32: remove on mouseup, not just ngOnDestroy
    this._removeDragListeners();
  }
 
  private _removeDragListeners(): void {
    if (this._dragMove) document.removeEventListener('mousemove', this._dragMove);
    if (this._dragUp)   document.removeEventListener('mouseup',   this._dragUp);
  }
 
  // ── Resize ────────────────────────────────────────────────────
  onResizeMousedown(e: MouseEvent, dir: ResizeDirection): void {
    // C15: left button only
    if (e.button !== 0) return;
    if (this.widget.locked) return;
 
    e.preventDefault();
    e.stopPropagation();
 
    this.resizeRef = {
      id:     this.widget.id,
      dir,
      startX: e.clientX,
      startY: e.clientY,
      origW:  this.widget.w,
      origH:  this.widget.h,
    };
    this.svc.setActive(this.widget.id);
 
    this._resizeMove = (mv: MouseEvent) => this._onResizeMove(mv);
    this._resizeUp   = ()                => this._onResizeUp();
    document.addEventListener('mousemove', this._resizeMove);
    document.addEventListener('mouseup',   this._resizeUp);
  }
 
  private _onResizeMove(mv: MouseEvent): void {
    const ref = this.resizeRef;
    if (!ref) return;
 
    const colW  = this.svc.colW();
    const dcols = Math.round((mv.clientX - ref.startX) / (colW + GAP));
    const drows = Math.round((mv.clientY - ref.startY) / (ROW_H + GAP));
 
    // C16: width clamped to COLS - widget.x, height clamped to MAX_WIDGET_H
    const nw = ref.dir.includes('e')
      ? clamp(ref.origW + dcols, 1, COLS - this.widget.x)
      : ref.origW;
    const nh = ref.dir.includes('s')
      ? clamp(ref.origH + drows, 1, MAX_WIDGET_H)
      : ref.origH;
 
    const widgets = this.svc.widgets();
    const active  = widgets.find(w => w.id === ref.id);
    if (!active) return;
 
    const proposed = { ...active, w: nw, h: nh };
    const resolved = resolveResize(proposed, nw, nh, ref.dir, widgets);
    if (resolved) {
      this.svc.setWidgetPositions(resolved);
    }
  }
 
  private _onResizeUp(): void {
    if (this.resizeRef) {
      this.resizeRef = null;
      this.svc.setActive(null);
      // C11: one history entry per resize
      this.svc.commitDragResize();
    }
    // Step 32: remove on mouseup
    this._removeResizeListeners();
  }
 
  private _removeResizeListeners(): void {
    if (this._resizeMove) document.removeEventListener('mousemove', this._resizeMove);
    if (this._resizeUp)   document.removeEventListener('mouseup',   this._resizeUp);
  }
}