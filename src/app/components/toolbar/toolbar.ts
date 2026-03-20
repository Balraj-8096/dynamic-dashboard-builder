import { Component, ElementRef, inject, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { DashboardService } from '../../services/dashboard.service';
import { ThemeService } from '../../services/theme.service';

@Component({
  selector: 'app-toolbar',
  imports: [],
  templateUrl: './toolbar.html',
  styleUrl: './toolbar.scss',
})
export class Toolbar {
  readonly svc = inject(DashboardService);
  readonly themeSvc = inject(ThemeService);
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

  openWizard(): void {
    this.svc.openWizard(null);   // null = open at Step 1
  }

  toggleSidebar(): void {
    this.svc.toggleSidebar();
  }

  toggleToolbarMenu(): void {
    this.svc.toggleToolbarMenu();
  }

  runPackLayout(): void {
    this.svc.applyPackLayout();
    this.svc.closeToolbarMenu();
  }

  clearAll(): void {
    this.svc.clearAll();
    this.svc.closeToolbarMenu();
  }

  openImport(): void {
    this.svc.openImport();
    this.svc.closeToolbarMenu();
  }

  exportLayout(): void {
    this.svc.exportLayout();
    this.svc.closeToolbarMenu();
  }

  openHelp(): void {
    this.svc.openHelp();
    this.svc.closeToolbarMenu();
  }

  toggleTheme(): void {
    this.themeSvc.toggle();
    this.svc.closeToolbarMenu();
  }

  goToView(): void {
    this.svc.closeToolbarMenu();
    this.router.navigate(['/view']);
  }
}
