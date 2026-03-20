import { CommonModule } from '@angular/common';
import { Component, HostListener, inject, OnInit } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { CATALOG } from '../../../core/catalog';
import { FACTORIES } from '../../../core/factories';
import { WidgetType, WidgetConfig } from '../../../core/interfaces';
import { DashboardService } from '../../../services/dashboard.service';
import { EditStatConfig } from "../../shared/edit-stat-config/edit-stat-config";
import { EditAnalyticsConfig } from "../../shared/edit-analytics-config/edit-analytics-config";
import { EditSeriesConfig } from "../../shared/edit-series-config/edit-series-config";
import { EditPieConfig } from "../../shared/edit-pie-config/edit-pie-config";
import { EditTableConfig } from "../../shared/edit-table-config/edit-table-config";
import { EditNoteConfig } from "../../shared/edit-note-config/edit-note-config";
import { EditProgressConfig } from "../../shared/edit-progress-config/edit-progress-config";
import { EditSectionConfig } from "../../shared/edit-section-config/edit-section-config";
import { WidgetMiniPreview } from "../../shared/widget-mini-preview/widget-mini-preview";
import { QueryBuilder, AnyQueryConfig } from "../../shared/query-builder/query-builder";
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';

export interface WizardDialogData {
  /** Pre-selected type from Ctrl+1-9 or sidebar click. null = open at Step 1. */
  initType: WidgetType | null;
}

@Component({
  selector: 'app-add-widget-wizard',
  imports: [
    CommonModule, ReactiveFormsModule, QueryBuilder,
    EditStatConfig, EditAnalyticsConfig, EditSeriesConfig, EditPieConfig,
    EditTableConfig, EditNoteConfig, EditProgressConfig, EditSectionConfig,
    WidgetMiniPreview,
  ],
  templateUrl: './add-widget-wizard.html',
  styleUrl: './add-widget-wizard.scss',
})
export class AddWidgetWizard implements OnInit {
  private readonly dialogRef = inject(MatDialogRef<AddWidgetWizard>);
  private readonly data      = inject<WizardDialogData>(MAT_DIALOG_DATA);
  private readonly svc       = inject(DashboardService);
  private readonly fb        = inject(FormBuilder);

  readonly catalog = CATALOG;
  readonly WidgetType = WidgetType;
  private viewportWidth = typeof window !== 'undefined' ? window.innerWidth : 1280;

  // ── Wizard state ──────────────────────────────────────────────
  step = 1;
  selectedType: WidgetType | null = null;
  cfg: WidgetConfig | null = null;

  titleForm = this.fb.group({ title: ['', Validators.required] });

  // ── Derived ───────────────────────────────────────────────────
  get cat()           { return this.catalog.find(c => c.type === this.selectedType) ?? null; }
  get isConfigStep()  { return this.step === 2; }
  readonly stepLabels = ['Choose Type', 'Configure'];

  // ── Lifecycle ─────────────────────────────────────────────────
  ngOnInit(): void {
    const initType = this.data?.initType ?? null;
    if (initType) {
      this._initForType(initType);
      this.step = 2;
    }
  }

  @HostListener('window:resize')
  onWindowResize(): void {
    this.viewportWidth = window.innerWidth;
  }

  // ── Step 1: select type card ───────────────────────────────────
  selectType(type: WidgetType): void {
    this._initForType(type);
    this.step = 2;
  }

  private _initForType(type: WidgetType): void {
    this.selectedType = type;
    const base = FACTORIES[type]?.(0, 0);
    this.cfg = base?.config ?? null;
    this.titleForm.setValue({ title: base?.title ?? '' });
  }

  // ── Query support ─────────────────────────────────────────────
  get hasQuery(): boolean {
    return ![WidgetType.Note, WidgetType.Section].includes(this.selectedType!);
  }

  get queryCfg(): AnyQueryConfig | null {
    return (this.cfg as any)?.queryConfig ?? null;
  }

  onQueryCfgChange(qcfg: AnyQueryConfig): void {
    this.cfg = { ...this.cfg, queryConfig: qcfg } as any;
  }

  // ── Display config panel output ───────────────────────────────
  onCfgChange(newCfg: WidgetConfig): void {
    this.cfg = newCfg;
  }

  // ── Navigation ────────────────────────────────────────────────
  canNext(): boolean { return this.step === 1 ? !!this.selectedType : true; }
  nextStep(): void   { if (this.canNext()) this.step++; }
  prevStep(): void   { if (this.step > 1) this.step--; }

  // ── Add to dashboard ─────────────────────────────────────────
  addToDashboard(): void {
    if (!this.selectedType || !this.cfg) return;
    if (this.titleForm.invalid) { this.titleForm.markAllAsTouched(); return; }

    const base = FACTORIES[this.selectedType]?.(0, 0);
    if (!base) return;

    this.svc.addWidget({
      ...base,
      title:  this.titleForm.value.title ?? base.title,
      config: { ...this.cfg },
    });
    this.dialogRef.close();
  }

  close(): void { this.dialogRef.close(); }

  // ── Preview helpers ───────────────────────────────────────────
  get previewTitle(): string { return this.titleForm.value.title ?? ''; }

  get previewContentH(): number {
    if (this.viewportWidth <= 720) return 120;
    if (this.viewportWidth <= 1024) return 140;
    return 180;
  }

  get summaryRows(): { k: string; v: string }[] {
    if (!this.selectedType) return [];
    const qcfg = this.queryCfg as any;
    return [
      { k: 'Type',    v: this.cat?.label ?? '' },
      { k: 'Title',   v: this.previewTitle || '—' },
      ...(qcfg?.product  ? [{ k: 'Product',  v: qcfg.product }] : []),
      ...(qcfg?.entities?.length
        ? [{ k: 'Entities', v: (qcfg.entities as string[]).join(' → ') }]
        : []),
    ];
  }

  // Config panel type casts for template binding
  get cfgAsStat()      { return this.cfg as any; }
  get cfgAsAnalytics() { return this.cfg as any; }
  get cfgAsSeries()    { return this.cfg as any; }
  get cfgAsPie()       { return this.cfg as any; }
  get cfgAsTable()     { return this.cfg as any; }
  get cfgAsProgress()  { return this.cfg as any; }
  get cfgAsNote()      { return this.cfg as any; }
  get cfgAsSection()   { return this.cfg as any; }
}
