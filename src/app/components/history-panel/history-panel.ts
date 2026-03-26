import {
  Component,
  inject,
  ChangeDetectionStrategy,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { DashboardService } from '../../services/dashboard.service';
import { HistorySnapshot } from '../../core/interfaces';

@Component({
  selector: 'app-history-panel',
  imports: [CommonModule],
  templateUrl: './history-panel.html',
  styleUrl: './history-panel.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HistoryPanel {
  readonly svc = inject(DashboardService);

  formatTime(timestamp: number): string {
    const d = new Date(timestamp);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  }

  trackEntry(_: number, entry: HistorySnapshot): number {
    return entry.timestamp;
  }
}
