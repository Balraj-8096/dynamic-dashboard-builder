import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { getCatalogItem } from '../../../core/catalog';
import { uid } from '../../../core/constants';
import { FACTORIES } from '../../../core/factories';
import { WidgetType, WidgetConfig, Widget } from '../../../core/interfaces';
import { StatWidget } from "../../widgets/stat-widget/stat-widget";
import { AnalyticsWidget } from "../../widgets/analytics-widget/analytics-widget";
import { BarWidget } from "../../widgets/bar-widget/bar-widget";
import { LineWidget } from "../../widgets/line-widget/line-widget";
import { TableWidget } from "../../widgets/table-widget/table-widget";
import { ProgressWidget } from "../../widgets/progress-widget/progress-widget";
import { NoteWidget } from "../../widgets/note-widget/note-widget";
import { SectionWidget } from "../../widgets/section-widget/section-widget";
import { PieWidget } from "../../widgets/pie-widget/pie-widget";

const PREVIEW_CONTENT_H = 180;

@Component({
  selector: 'app-widget-mini-preview',
  imports: [
    CommonModule,
    StatWidget,
    AnalyticsWidget,
    BarWidget,
    LineWidget,
    TableWidget,
    ProgressWidget,
    NoteWidget,
    SectionWidget,
    PieWidget
],
  templateUrl: './widget-mini-preview.html',
  styleUrl: './widget-mini-preview.scss',
})
export class WidgetMiniPreview implements OnChanges {
  @Input({ required: true }) type!: WidgetType | null;
  @Input() config: WidgetConfig | null = null;
  @Input() title = '';
  @Input() contentH = PREVIEW_CONTENT_H;

  fakeWidget: Widget | null = null;
  catalogItem: ReturnType<typeof getCatalogItem> = undefined;

  ngOnChanges(changes: SimpleChanges): void {
    if (!this.type) {
      this.fakeWidget = null;
      this.catalogItem = undefined;
      return;
    }

    this.catalogItem = getCatalogItem(this.type);

    const base = FACTORIES[this.type]?.(0, 0);
    const cfg = this.config ?? base?.config ?? {};

    this.fakeWidget = {
      id: 'preview-' + uid(),
      type: this.type,
      title: this.title || this.catalogItem?.label || '',
      locked: false,
      x: 0, y: 0,
      w: this.catalogItem?.defaultSize.w ?? 4,
      h: this.catalogItem?.defaultSize.h ?? 3,
      config: cfg as WidgetConfig,
    };
  }
}
