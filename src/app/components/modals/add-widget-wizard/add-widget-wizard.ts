import { CommonModule } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { CATALOG } from '../../../core/catalog';
import { FIELD_POOL_MAP, hasFieldPool, DATA_SCHEMA, buildConfigFromFields } from '../../../core/data-schema';
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
import { FieldSelector } from "../../shared/field-selector/field-selector";
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogContent, MatDialogActions } from '@angular/material/dialog';

export interface WizardDialogData {
  /** Pre-selected type from Ctrl+1-9 or sidebar click. null = open at Step 1. */
  initType: WidgetType | null;
}

@Component({
  selector: 'app-add-widget-wizard',
  imports: [CommonModule,
    ReactiveFormsModule, EditStatConfig, EditAnalyticsConfig, EditSeriesConfig, EditPieConfig, EditTableConfig, EditNoteConfig, EditProgressConfig, EditSectionConfig, WidgetMiniPreview, FieldSelector, MatDialogContent, MatDialogActions],
  templateUrl: './add-widget-wizard.html',
  styleUrl: './add-widget-wizard.scss',
})
export class AddWidgetWizard implements OnInit {
  private readonly dialogRef = inject(MatDialogRef<AddWidgetWizard>);
  private readonly data = inject<WizardDialogData>(MAT_DIALOG_DATA);
  private readonly svc = inject(DashboardService);
  private readonly fb = inject(FormBuilder);

  readonly catalog = CATALOG;

  // ── Wizard state ──────────────────────────────────────────────
  step = 1;
  selectedType: WidgetType | null = null;
  cfg: WidgetConfig | null = null;
  selectedFields: string[] = [];

  titleForm = this.fb.group({ title: ['', Validators.required] });

  // ── Derived ───────────────────────────────────────────────────
  get cat() { return this.catalog.find(c => c.type === this.selectedType) ?? null; }
  get poolMap() { return this.selectedType ? (FIELD_POOL_MAP as any)[this.selectedType] ?? null : null; }
  get hasFields(): boolean { return hasFieldPool(this.selectedType!); }
  get totalSteps(): number { return this.hasFields ? 3 : 2; }
  get stepLabels(): string[] {
    return this.hasFields
      ? ['Choose Type', 'Select Fields', 'Configure']
      : ['Choose Type', 'Configure'];
  }
  get isConfigStep(): boolean { return this.step === this.totalSteps; }
  get isFieldsStep(): boolean { return this.hasFields && this.step === 2; }

  // ── Lifecycle ─────────────────────────────────────────────────
  ngOnInit(): void {
    const initType = this.data?.initType ?? null;
    if (initType) {
      this._initForType(initType);
      // Skip step 1 — type already chosen
      this.step = 2;
    }
  }

  // ── Step 1: select type card ───────────────────────────────────
  selectType(type: WidgetType): void {
    this._initForType(type);
    this.step = 2;
  }

  private _initForType(type: WidgetType): void {
    this.selectedType = type;
    const base = FACTORIES[type]?.(0, 0);
    const allIds = this.poolMap
      ? (DATA_SCHEMA as any)[this.poolMap.pool].map((f: any) => f.id)
      : [];
    const preIds = allIds.slice(0, 3);

    this.selectedFields = preIds;
    this.cfg = preIds.length
      ? buildConfigFromFields(type, preIds, base?.config ?? {})
      : (base?.config ?? null);

    this.titleForm.setValue({ title: base?.title ?? '' });
  }

  // ── Step 2: field selection ───────────────────────────────────
  onFieldsChange(ids: string[]): void {
    this.selectedFields = ids;
    if (this.selectedType && this.cfg) {
      this.cfg = buildConfigFromFields(this.selectedType, ids, this.cfg);
    }
  }

  // ── Config panel output ───────────────────────────────────────
  onCfgChange(newCfg: WidgetConfig): void {
    this.cfg = newCfg;
  }

  // ── Navigation ────────────────────────────────────────────────
  canNext(): boolean {
    if (this.step === 1) return !!this.selectedType;
    if (this.isFieldsStep) return this.selectedFields.length > 0;
    return true;
  }

  nextStep(): void { if (this.canNext()) this.step++; }
  prevStep(): void { if (this.step > 1) this.step--; }

  // ── Add to dashboard ─────────────────────────────────────────
  addToDashboard(): void {
    if (!this.selectedType || !this.cfg) return;
    if (this.titleForm.invalid) { this.titleForm.markAllAsTouched(); return; }

    const base = FACTORIES[this.selectedType]?.(0, 0);
    if (!base) return;

    this.svc.addWidget({
      ...base,
      title: this.titleForm.value.title ?? base.title,
      config: { ...this.cfg },
    });
    this.dialogRef.close();
  }

  close(): void { this.dialogRef.close(); }

  // ── Preview helpers ───────────────────────────────────────────
  get previewTitle(): string { return this.titleForm.value.title ?? ''; }

  get summaryRows(): { k: string; v: string }[] {
    if (!this.selectedType) return [];
    return [
      { k: 'Type', v: this.cat?.label ?? '' },
      { k: 'Fields', v: this.hasFields ? `${this.selectedFields.length} selected` : 'N/A' },
      { k: 'Title', v: this.previewTitle || '—' },
    ];
  }

  // Selected field chips for the preview panel on step 2
  get selectedFieldChips(): { label: string; color: string }[] {
    if (!this.isFieldsStep || !this.poolMap) return [];
    const pool: any[] = (DATA_SCHEMA as any)[this.poolMap.pool] ?? [];
    return this.selectedFields
      .map(id => pool.find((f: any) => f.id === id))
      .filter(Boolean)
      .map((f: any) => ({
        label: f.label || f.name || f.key,
        color: f.accent || f.color || 'var(--acc)',
      }));
  }

  // Config panel type casts (for template binding)
  get cfgAsStat() { return this.cfg as any; }
  get cfgAsAnalytics() { return this.cfg as any; }
  get cfgAsSeries() { return this.cfg as any; }
  get cfgAsPie() { return this.cfg as any; }
  get cfgAsTable() { return this.cfg as any; }
  get cfgAsProgress() { return this.cfg as any; }
  get cfgAsNote() { return this.cfg as any; }
  get cfgAsSection() { return this.cfg as any; }
}
