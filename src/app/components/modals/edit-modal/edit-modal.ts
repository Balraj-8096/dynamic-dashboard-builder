import { CommonModule } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogContent, MatDialogActions } from '@angular/material/dialog';
import { getCatalogItem } from '../../../core/catalog';
import { FIELD_POOL_MAP, DATA_SCHEMA, buildConfigFromFields } from '../../../core/data-schema';
import { Widget, WidgetConfig } from '../../../core/interfaces';
import { DashboardService } from '../../../services/dashboard.service';
import { FieldSelector } from "../../shared/field-selector/field-selector";
import { EditStatConfig } from "../../shared/edit-stat-config/edit-stat-config";
import { EditAnalyticsConfig } from "../../shared/edit-analytics-config/edit-analytics-config";
import { EditSeriesConfig } from "../../shared/edit-series-config/edit-series-config";
import { EditPieConfig } from "../../shared/edit-pie-config/edit-pie-config";
import { EditTableConfig } from "../../shared/edit-table-config/edit-table-config";
import { EditProgressConfig } from "../../shared/edit-progress-config/edit-progress-config";
import { EditNoteConfig } from "../../shared/edit-note-config/edit-note-config";
import { EditSectionConfig } from "../../shared/edit-section-config/edit-section-config";
import { StatWidget } from "../../widgets/stat-widget/stat-widget";
import { AnalyticsWidget } from "../../widgets/analytics-widget/analytics-widget";
import { BarWidget } from "../../widgets/bar-widget/bar-widget";
import { LineWidget } from "../../widgets/line-widget/line-widget";
import { PieWidget } from "../../widgets/pie-widget/pie-widget";
import { TableWidget } from "../../widgets/table-widget/table-widget";
import { ProgressWidget } from "../../widgets/progress-widget/progress-widget";
import { NoteWidget } from "../../widgets/note-widget/note-widget";
import { SectionWidget } from "../../widgets/section-widget/section-widget";

type TabId = 'fields' | 'configure';

@Component({
  selector: 'app-edit-modal',
  imports: [CommonModule,
    FormsModule, MatDialogContent, MatDialogActions, FieldSelector, EditStatConfig, EditAnalyticsConfig, EditSeriesConfig, EditPieConfig, EditTableConfig, EditProgressConfig, EditNoteConfig, EditSectionConfig, StatWidget, AnalyticsWidget, BarWidget, LineWidget, PieWidget, TableWidget, ProgressWidget, NoteWidget, SectionWidget],
  templateUrl: './edit-modal.html',
  styleUrl: './edit-modal.scss',
})
export class EditModal implements OnInit {
  private readonly dialogRef = inject(MatDialogRef<EditModal>);
  readonly widget = inject<Widget>(MAT_DIALOG_DATA);
  private readonly svc = inject(DashboardService);

  // ── Local editable state ──────────────────────────────────────
  title = '';
  cfg!: WidgetConfig;
  activeTab: TabId = 'configure';

  // ── Derived from widget type ──────────────────────────────────
  get cat() { return getCatalogItem(this.widget.type); }
  get poolMap() { return (FIELD_POOL_MAP as any)[this.widget.type] ?? null; }

  get allIds(): string[] {
    return this.poolMap
      ? (DATA_SCHEMA as any)[this.poolMap.pool].map((f: any) => f.id)
      : [];
  }

  get selectedFields(): string[] {
    return (this.cfg as any)?.selectedFields ?? this.allIds;
  }

  /** Tabs — Fields tab only shown when widget type has a field pool */
  get tabs(): { id: TabId; label: string; icon: string }[] {
    return [
      ...(this.poolMap ? [{ id: 'fields' as TabId, label: 'Fields', icon: '◈' }] : []),
      { id: 'configure', label: 'Configure', icon: '⚙' },
    ];
  }

  // ── Lifecycle ─────────────────────────────────────────────────
  ngOnInit(): void {
    this.title = this.widget.title;
    // Deep-clone config so edits don't mutate the live widget
    this.cfg = JSON.parse(JSON.stringify(this.widget.config));
    // Default to Fields tab when available
    this.activeTab = this.poolMap ? 'fields' : 'configure';
  }

  // ── Field selection ───────────────────────────────────────────
  onFieldsChange(ids: string[]): void {
    this.cfg = buildConfigFromFields(this.widget.type, ids, this.cfg);
  }

  // ── Config panel output ───────────────────────────────────────
  onCfgChange(newCfg: WidgetConfig): void {
    this.cfg = newCfg;
  }

  // ── Preview ───────────────────────────────────────────────────
  /** Preview height: taller for chart types */
  get previewH(): number {
    if (['bar', 'line', 'pie'].includes(this.widget.type)) return 240;
    if (this.widget.type === 'table') return 220;
    return 180;
  }

  /** Fake widget with live title+cfg for preview rendering */
  get previewWidget(): Widget {
    return { ...this.widget, title: this.title, config: this.cfg ?? this.widget.config };
  }

  // ── Settings strip (right panel) ─────────────────────────────
  get settingsRows(): { k: string; v: string; isColor?: boolean }[] {
    const t = this.widget.type;
    const cfg = this.cfg as any;
    return [
      { k: 'Type', v: this.cat?.label ?? '' },
      ...(this.poolMap
        ? [{ k: 'Fields', v: `${this.selectedFields.length} of ${this.allIds.length}` }]
        : []),
      { k: 'Title', v: this.title || '—' },
      ...(cfg?.accent
        ? [{ k: 'Accent', v: cfg.accent, isColor: true }]
        : []),
      ...(t === 'table' && cfg?.columns
        ? [{ k: 'Columns', v: `${cfg.columns.length} visible` }]
        : []),
      ...(t === 'progress' && cfg?.items
        ? [{ k: 'Items', v: `${cfg.items.length} bars` }]
        : []),
      ...(t === 'pie' && cfg?.data
        ? [{ k: 'Segments', v: `${cfg.data.length}` }]
        : []),
      ...((t === 'bar' || t === 'line') && cfg?.series
        ? [{ k: 'Series', v: `${cfg.series.length}` }]
        : []),
    ];
  }

  /** Field chips shown in right panel when on Fields tab */
  get fieldChips(): { label: string; color: string }[] {
    if (this.activeTab !== 'fields' || !this.poolMap) return [];
    const pool: any[] = (DATA_SCHEMA as any)[this.poolMap.pool] ?? [];
    return this.selectedFields
      .map(id => pool.find((f: any) => f.id === id))
      .filter(Boolean)
      .map((f: any) => ({
        label: f.label || f.name || f.key,
        color: f.accent || f.color || 'var(--acc)',
      }));
  }

  // ── Actions ───────────────────────────────────────────────────
  save(): void {
    // C14 — svc.saveWidget is a no-op if widget was deleted while modal open
    this.svc.saveWidget({ ...this.widget, title: this.title, config: { ...this.cfg } });
    this.dialogRef.close();
  }

  cancel(): void {
    this.dialogRef.close();
  }

  // Type casts for config panel bindings
  get cfgAsStat() { return this.cfg as any; }
  get cfgAsAnalytics() { return this.cfg as any; }
  get cfgAsSeries() { return this.cfg as any; }
  get cfgAsPie() { return this.cfg as any; }
  get cfgAsTable() { return this.cfg as any; }
  get cfgAsProgress() { return this.cfg as any; }
  get cfgAsNote() { return this.cfg as any; }
  get cfgAsSection() { return this.cfg as any; }
}
