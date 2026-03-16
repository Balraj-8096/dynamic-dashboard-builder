import { Component, ElementRef, inject, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { DashboardService } from '../../services/dashboard.service';

@Component({
  selector: 'app-toolbar',
  imports: [],
  templateUrl: './toolbar.html',
  styleUrl: './toolbar.scss',
})
export class Toolbar {
  readonly svc = inject(DashboardService);
  private readonly router = inject(Router);

  @ViewChild('titleInput') titleInputRef?: ElementRef<HTMLInputElement>;

  get widgetCount(): number {
    return this.svc.widgetCount();
  }

  startEditTitle(): void {
    this.svc.editingTitle.set(true);
    // Focus the input after Angular renders it
    setTimeout(() => this.titleInputRef?.nativeElement.focus(), 0);
  }

  onTitleBlur(value: string): void {
    this.svc.setDashTitle(value.trim() || this.svc.dashTitle());
    this.svc.editingTitle.set(false);
  }

  onTitleKeyDown(e: KeyboardEvent, value: string): void {
    if (e.key === 'Enter' || e.key === 'Escape') {
      this.onTitleBlur(value);
    }
  }

  goToView(): void {
    this.router.navigate(['/view']);
  }

  openWizard(): void {
    this.svc.openWizard(null);   // null = open at Step 1
  }
}