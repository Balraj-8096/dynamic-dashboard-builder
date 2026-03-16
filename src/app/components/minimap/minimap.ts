import { Component, ElementRef, inject, ViewChild } from '@angular/core';
import { getCatalogColor } from '../../core/catalog';
import { MINIMAP_W } from '../../core/constants';
import { gridToPixel } from '../../core/layout.utils';
import { DashboardService } from '../../services/dashboard.service';

const MINIMAP_MAX_H = 120; // cap SVG height to keep minimap compact
@Component({
  selector: 'app-minimap',
  imports: [],
  templateUrl: './minimap.html',
  styleUrl: './minimap.scss',
})
export class Minimap {
  readonly svc = inject(DashboardService);

  @ViewChild('svgEl') svgRef?: ElementRef<SVGSVGElement>;

  readonly W = MINIMAP_W;

  // ── Derived geometry ─────────────────────────────────────────
  get scale(): number {
    return this.W / Math.max(this.svc.canvasW(), 1);
  }

  get minimapH(): number {
    return Math.min(Math.round(this.svc.canvasH() * this.scale), MINIMAP_MAX_H);
  }

  // ── Widget rects ─────────────────────────────────────────────
  get widgetRects() {
    const scale = this.scale;
    const colW = this.svc.colW();
    return this.svc.widgets().map(w => {
      const p = gridToPixel(w, colW);
      const color = getCatalogColor(w.type);
      return {
        id: w.id,
        x: p.left * scale,
        y: p.top * scale,
        width: p.width * scale,
        height: p.height * scale,
        fill: color + '44',
        stroke: color + '88',
      };
    });
  }

  // ── Viewport rect (uses signal — bug fix #11, NOT read from DOM) ──
  get viewportRect() {
    const scale = this.scale;
    const canvasH = this.svc.canvasH();
    // viewH: estimate from minimap height and scale ratio
    const viewH = this.minimapH / scale;
    const scrollTop = this.svc.scrollTop();
    const vpH = Math.min(Math.round(viewH * scale), this.minimapH);
    const vpY = Math.round(scrollTop * scale);
    return { x: 0, y: vpY, width: this.W, height: vpH };
  }

  // ── Click to jump ─────────────────────────────────────────────
  onMinimapClick(e: MouseEvent): void {
    const el = e.currentTarget as HTMLElement;
    const rect = el.getBoundingClientRect();
    const clickY = e.clientY - rect.top;
    // Convert minimap Y → canvas Y, center the viewport
    const canvasY = clickY / this.scale;
    const viewH = this.minimapH / this.scale;
    const target = Math.max(0, canvasY - viewH / 2);
    this.svc.setScrollTop(target);
    // Sync the actual scroll on the main scroll container
    // (canvas component owns the DOM element; we fire a synthetic scroll via signal)
    // The canvas scroll-listener will update svc.scrollTop on the next scroll event.
    // For immediate jump we also scroll the main area if accessible:
    const main = document.querySelector('.scroll-area') as HTMLElement | null;
    if (main) main.scrollTop = target;
  }
}
