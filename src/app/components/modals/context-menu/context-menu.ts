import { Component, inject } from '@angular/core';
import { Widget } from '../../../core/interfaces';
import { DashboardService } from '../../../services/dashboard.service';

interface MenuItem {
  icon: string;
  label: string;
  color: string;
  action: () => void;
}

@Component({
  selector: 'app-context-menu',
  imports: [],
  templateUrl: './context-menu.html',
  styleUrl: './context-menu.scss',
})
export class ContextMenu {
  readonly svc = inject(DashboardService);

  get state() { return this.svc.contextMenu()!; }
  get x() { return this.state.x; }
  get y() { return this.state.y; }

  get widget(): Widget | undefined {
    return this.svc.widgets().find(w => w.id === this.state.id);
  }

  get isLocked(): boolean  { return !!this.widget?.locked; }

  get menuItems(): (MenuItem | null)[] {
    const w = this.widget;
    if (!w) return [];
    return [
      {
        icon: '✎',
        label: 'Edit widget',
        color: 'var(--acc)',
        action: () => { this.svc.openEditModal(w); this.close(); },
      },
      {
        icon: '⊞',
        label: 'Duplicate',
        color: 'var(--grn)',
        action: () => { this.svc.duplicateWidget(w); this.close(); },
      },
      null, // divider
      {
        icon: this.isLocked ? '🔒' : '🔓',
        label: this.isLocked ? 'Unlock widget' : 'Lock widget',
        color: 'var(--amb)',
        action: () => { this.svc.lockWidget(w.id); this.close(); },
      },
      null, // divider
      {
        icon: '✕',
        label: 'Delete widget',
        color: 'var(--red)',
        action: () => { this.svc.deleteWidget(w.id); this.close(); },
      },
    ];
  }

  close(): void { this.svc.closeContextMenu(); }
}
