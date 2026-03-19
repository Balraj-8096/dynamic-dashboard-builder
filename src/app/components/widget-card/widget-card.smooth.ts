import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  Input,
  OnDestroy,
  inject,
} from '@angular/core';
import { CommonModule } from '@angular/common';

import { DashboardService } from '../../services/dashboard.service';
import { PixelRect, ResizeDirection, Widget } from '../../core/interfaces';
import { gridToPixel, resolveDrag, resolveResize } from '../../core/layout.utils';
import {
  COLS,
  GAP,
  HDR_H,
  MAX_WIDGET_H,
  ROW_H,
  clamp,
} from '../../core/constants';
import { getCatalogItem } from '../../core/catalog';
import { StatWidget } from '../widgets/stat-widget/stat-widget';
import { AnalyticsWidget } from '../widgets/analytics-widget/analytics-widget';
import { BarWidget } from '../widgets/bar-widget/bar-widget';
import { LineWidget } from '../widgets/line-widget/line-widget';
import { PieWidget } from '../widgets/pie-widget/pie-widget';
import { ProgressWidget } from '../widgets/progress-widget/progress-widget';
import { TableWidget } from '../widgets/table-widget/table-widget';
import { NoteWidget } from '../widgets/note-widget/note-widget';
import { SectionWidget } from '../widgets/section-widget/section-widget';

@Component({
  selector: 'app-widget-card',
  imports: [
    CommonModule,
    StatWidget,
    AnalyticsWidget,
    BarWidget,
    LineWidget,
    PieWidget,
    ProgressWidget,
    TableWidget,
    NoteWidget,
    SectionWidget,
  ],
  templateUrl: './widget-card.html',
  styleUrl: './widget-card.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WidgetCard implements OnDestroy {
  @Input({ required: true }) widget!: Widget;

  readonly RD = ResizeDirection;
  readonly svc = inject(DashboardService);
  private readonly cdr = inject(ChangeDetectorRef);

  private static readonly DRAG_THRESHOLD_PX = 4;

  private dragRef: {
    startX: number;
    startY: number;
    origX: number;
    origY: number;
    latestX: number;
    latestY: number;
    engaged: boolean;
    translateX: number;
    translateY: number;
    previewLayout: Widget[] | null;
    previewRect: PixelRect | null;
  } | null = null;

  private resizeRef: {
    dir: ResizeDirection;
    startX: number;
    startY: number;
    origW: number;
    origH: number;
    latestX: number;
    latestY: number;
    liveRect: PixelRect;
    previewLayout: Widget[] | null;
    previewRect: PixelRect | null;
  } | null = null;

  private dragRafId: number | null = null;
  private resizeRafId: number | null = null;

  private dragMoveHandler!: (e: MouseEvent) => void;
  private dragUpHandler!: (e: MouseEvent) => void;
  private resizeMoveHandler!: (e: MouseEvent) => void;
  private resizeUpHandler!: (e: MouseEvent) => void;

  get pixelRect(): PixelRect {
    return gridToPixel(this.widget, this.svc.colW());
  }

  get currentRect(): PixelRect {
    return this.resizeRef?.liveRect ?? this.pixelRect;
  }

  get contentH(): number {
    return this.currentRect.height - HDR_H;
  }

  get isSelected(): boolean {
    return this.svc.selectedId() === this.widget.id;
  }

  get isActive(): boolean {
    return this.svc.activeId() === this.widget.id;
  }

  get isFront(): boolean {
    return this.svc.frontId() === this.widget.id;
  }

  get isAnimating(): boolean {
    return this.svc.animatingId() === this.widget.id;
  }

  get isLocked(): boolean {
    return this.widget.locked;
  }

  get isDragging(): boolean {
    return !!this.dragRef?.engaged;
  }

  get isResizing(): boolean {
    return !!this.resizeRef;
  }

  get isInteracting(): boolean {
    return this.isDragging || this.isResizing;
  }

  get catalogItem() {
    return getCatalogItem(this.widget.type);
  }

  get catalogIcon(): string {
    return this.catalogItem?.icon ?? '';
  }

  get catalogColor(): string {
    return this.catalogItem?.color ?? 'var(--acc)';
  }

  get catalogLabel(): string {
    return this.catalogItem?.label ?? '';
  }

  get zIndex(): number {
    if (this.isActive || this.isInteracting) return 200;
    if (this.isSelected) return 150;
    if (this.isFront) return 100;
    return 1;
  }

  get posStyle(): Record<string, string> {
    const rect = this.currentRect;
    const style: Record<string, string> = {
      position: 'absolute',
      left: `${rect.left}px`,
      top: `${rect.top}px`,
      width: `${rect.width}px`,
      height: `${rect.height}px`,
      zIndex: String(this.zIndex),
    };

    if (this.dragRef?.engaged) {
      style['transform'] = `translate3d(${this.dragRef.translateX}px, ${this.dragRef.translateY}px, 0)`;
    }

    return style;
  }

  get previewGhostStyle(): Record<string, string> | null {
    const rect = this.dragRef?.previewRect ?? this.resizeRef?.previewRect ?? null;
    if (!rect || !this.isInteracting) return null;

    return {
      left: `${rect.left}px`,
      top: `${rect.top}px`,
      width: `${rect.width}px`,
      height: `${rect.height}px`,
      zIndex: String(Math.max(this.zIndex - 1, 1)),
    };
  }

  ngOnDestroy(): void {
    this.removeDragListeners();
    this.removeResizeListeners();
    if (this.dragRafId !== null) cancelAnimationFrame(this.dragRafId);
    if (this.resizeRafId !== null) cancelAnimationFrame(this.resizeRafId);
  }

  onCardClick(e: MouseEvent): void {
    e.stopPropagation();
    this.svc.select(this.widget.id);
  }

  onContextMenu(e: MouseEvent): void {
    e.preventDefault();
    e.stopPropagation();
    this.svc.openContextMenu(this.widget.id, e.clientX, e.clientY);
  }

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
    this.svc.deleteWidget(this.widget.id);
  }

  onSurfaceMousedown(e: MouseEvent): void {
    if (e.button !== 0) return;
    if (this.shouldIgnoreDragStart(e.target)) return;

    e.stopPropagation();
    this.svc.select(this.widget.id);
    this.svc.closeContextMenu();

    if (this.widget.locked) return;

    e.preventDefault();

    this.dragRef = {
      startX: e.clientX,
      startY: e.clientY,
      origX: this.widget.x,
      origY: this.widget.y,
      latestX: e.clientX,
      latestY: e.clientY,
      engaged: false,
      translateX: 0,
      translateY: 0,
      previewLayout: null,
      previewRect: null,
    };

    this.dragMoveHandler = (mv: MouseEvent) => this.onDragMove(mv);
    this.dragUpHandler = () => this.onDragUp();
    document.addEventListener('mousemove', this.dragMoveHandler);
    document.addEventListener('mouseup', this.dragUpHandler);
  }

  onResizeMousedown(e: MouseEvent, dir: ResizeDirection): void {
    if (e.button !== 0 || this.widget.locked) return;

    e.preventDefault();
    e.stopPropagation();

    const baseRect = gridToPixel(this.widget, this.svc.colW());
    this.resizeRef = {
      dir,
      startX: e.clientX,
      startY: e.clientY,
      origW: this.widget.w,
      origH: this.widget.h,
      latestX: e.clientX,
      latestY: e.clientY,
      liveRect: baseRect,
      previewLayout: null,
      previewRect: baseRect,
    };

    this.svc.setActive(this.widget.id);

    this.resizeMoveHandler = (mv: MouseEvent) => this.onResizeMove(mv);
    this.resizeUpHandler = () => this.onResizeUp();
    document.addEventListener('mousemove', this.resizeMoveHandler);
    document.addEventListener('mouseup', this.resizeUpHandler);
  }

  private onDragMove(mv: MouseEvent): void {
    if (!this.dragRef) return;
    this.dragRef.latestX = mv.clientX;
    this.dragRef.latestY = mv.clientY;
    this.scheduleDragPreview();
  }

  private onDragUp(): void {
    const nextLayout = this.dragRef?.previewLayout ?? null;
    const shouldCommit = !!this.dragRef?.engaged && !!nextLayout && this.layoutChanged(nextLayout);

    this.dragRef = null;
    if (this.dragRafId !== null) {
      cancelAnimationFrame(this.dragRafId);
      this.dragRafId = null;
    }
    this.removeDragListeners();

    if (shouldCommit && nextLayout) {
      this.svc.setWidgetPositions(nextLayout);
      this.svc.commitDragResize();
    } else {
      this.svc.setActive(null);
    }

    this.cdr.markForCheck();
  }

  private onResizeMove(mv: MouseEvent): void {
    if (!this.resizeRef) return;
    this.resizeRef.latestX = mv.clientX;
    this.resizeRef.latestY = mv.clientY;
    this.scheduleResizePreview();
  }

  private onResizeUp(): void {
    const nextLayout = this.resizeRef?.previewLayout ?? null;
    const shouldCommit = !!nextLayout && this.layoutChanged(nextLayout);

    this.resizeRef = null;
    if (this.resizeRafId !== null) {
      cancelAnimationFrame(this.resizeRafId);
      this.resizeRafId = null;
    }
    this.removeResizeListeners();

    if (shouldCommit && nextLayout) {
      this.svc.setWidgetPositions(nextLayout);
      this.svc.commitDragResize();
    } else {
      this.svc.setActive(null);
    }

    this.cdr.markForCheck();
  }

  private scheduleDragPreview(): void {
    if (this.dragRafId !== null) return;
    this.dragRafId = requestAnimationFrame(() => {
      this.dragRafId = null;
      this.applyDragPreview();
    });
  }

  private scheduleResizePreview(): void {
    if (this.resizeRafId !== null) return;
    this.resizeRafId = requestAnimationFrame(() => {
      this.resizeRafId = null;
      this.applyResizePreview();
    });
  }

  private applyDragPreview(): void {
    const ref = this.dragRef;
    if (!ref) return;

    const zoom = this.svc.zoom();
    const dx = (ref.latestX - ref.startX) / zoom;
    const dy = (ref.latestY - ref.startY) / zoom;

    ref.translateX = dx;
    ref.translateY = dy;

    if (!ref.engaged) {
      const movedFarEnough =
        Math.abs(dx) >= WidgetCard.DRAG_THRESHOLD_PX ||
        Math.abs(dy) >= WidgetCard.DRAG_THRESHOLD_PX;

      if (!movedFarEnough) {
        this.cdr.markForCheck();
        return;
      }

      ref.engaged = true;
      this.svc.setActive(this.widget.id);
    }

    const colW = this.svc.colW();
    const snappedX = clamp(
      ref.origX + Math.round(dx / (colW + GAP)),
      0,
      COLS - this.widget.w
    );
    const snappedY = clamp(
      ref.origY + Math.round(dy / (ROW_H + GAP)),
      0,
      50
    );

    const resolved = resolveDrag(this.widget, snappedX, snappedY, this.svc.widgets());
    ref.previewLayout = resolved;
    ref.previewRect = gridToPixel(
      resolved?.find(w => w.id === this.widget.id) ?? this.widget,
      colW
    );

    this.cdr.markForCheck();
  }

  private applyResizePreview(): void {
    const ref = this.resizeRef;
    if (!ref) return;

    const colW = this.svc.colW();
    const zoom = this.svc.zoom();
    const dx = (ref.latestX - ref.startX) / zoom;
    const dy = (ref.latestY - ref.startY) / zoom;
    const baseRect = gridToPixel(this.widget, colW);

    const dcols = Math.round(dx / (colW + GAP));
    const drows = Math.round(dy / (ROW_H + GAP));
    const snappedW = ref.dir.includes('e')
      ? clamp(ref.origW + dcols, 1, COLS - this.widget.x)
      : ref.origW;
    const snappedH = ref.dir.includes('s')
      ? clamp(ref.origH + drows, 1, MAX_WIDGET_H)
      : ref.origH;

    ref.liveRect = {
      ...baseRect,
      width: ref.dir.includes('e')
        ? clamp(
            baseRect.width + dx,
            this.gridWidthPx(1),
            this.gridWidthPx(COLS - this.widget.x)
          )
        : baseRect.width,
      height: ref.dir.includes('s')
        ? clamp(
            baseRect.height + dy,
            this.gridHeightPx(1),
            this.gridHeightPx(MAX_WIDGET_H)
          )
        : baseRect.height,
    };

    const resolved = resolveResize(this.widget, snappedW, snappedH, ref.dir, this.svc.widgets());
    ref.previewLayout = resolved;
    ref.previewRect = gridToPixel(
      resolved?.find(w => w.id === this.widget.id) ?? this.widget,
      colW
    );

    this.cdr.markForCheck();
  }

  private removeDragListeners(): void {
    if (this.dragMoveHandler) document.removeEventListener('mousemove', this.dragMoveHandler);
    if (this.dragUpHandler) document.removeEventListener('mouseup', this.dragUpHandler);
  }

  private removeResizeListeners(): void {
    if (this.resizeMoveHandler) document.removeEventListener('mousemove', this.resizeMoveHandler);
    if (this.resizeUpHandler) document.removeEventListener('mouseup', this.resizeUpHandler);
  }

  private gridWidthPx(cols: number): number {
    return cols * (this.svc.colW() + GAP) - GAP;
  }

  private gridHeightPx(rows: number): number {
    return rows * ROW_H + (rows - 1) * GAP;
  }

  private layoutChanged(next: Widget[]): boolean {
    const current = this.svc.widgets();
    if (current.length !== next.length) return true;

    return next.some((widget, index) => {
      const prev = current[index];
      return !prev ||
        prev.id !== widget.id ||
        prev.x !== widget.x ||
        prev.y !== widget.y ||
        prev.w !== widget.w ||
        prev.h !== widget.h;
    });
  }

  private shouldIgnoreDragStart(target: EventTarget | null): boolean {
    const el = target as HTMLElement | null;
    if (!el) return false;

    return !!el.closest(
      'button, input, textarea, select, option, a, .action-btn, .resize-handle, [data-no-drag], [contenteditable="true"]'
    );
  }
}
