import { Component, Input } from '@angular/core';
import { Widget } from '../../../core/interfaces';
import { getCatalogItem } from '../../../core/catalog';
import { HDR_H } from '../../../core/constants';
import { gridToPixel } from '../../../core/layout.utils';
import { StatWidget } from "../../widgets/stat-widget/stat-widget";
import { AnalyticsWidget } from "../../widgets/analytics-widget/analytics-widget";
import { BarWidget } from "../../widgets/bar-widget/bar-widget";
import { LineWidget } from "../../widgets/line-widget/line-widget";
import { PieWidget } from "../../widgets/pie-widget/pie-widget";
import { TableWidget } from "../../widgets/table-widget/table-widget";
import { ProgressWidget } from "../../widgets/progress-widget/progress-widget";
import { NoteWidget } from "../../widgets/note-widget/note-widget";
import { SectionWidget } from "../../widgets/section-widget/section-widget";
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-view-widget-card',
  imports: [CommonModule, StatWidget, AnalyticsWidget, BarWidget, LineWidget, PieWidget, TableWidget, ProgressWidget, NoteWidget, SectionWidget],
  templateUrl: './view-widget-card.html',
  styleUrl: './view-widget-card.scss',
})
export class ViewWidgetCard {
  @Input({ required: true }) widget!: Widget;
  @Input({ required: true }) colW!: number;

  get cat() { return getCatalogItem(this.widget.type); }
  get rect() { return gridToPixel(this.widget, this.colW); }
  get contentH() { return this.rect.height - HDR_H; }

  get posStyle(): Record<string, string> {
    const r = this.rect;
    return {
      position: 'absolute',
      left: r.left + 'px',
      top: r.top + 'px',
      width: r.width + 'px',
      height: r.height + 'px',
    };
  }
}
