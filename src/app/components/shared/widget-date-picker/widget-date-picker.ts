// ═══════════════════════════════════════════════════════════════
//  DASHCRAFT — Widget Date Picker
//  Compact per-widget date-range preset dropdown.
//  Drop onto any query widget to let users slice data by period
//  without touching the global filter bar.
// ═══════════════════════════════════════════════════════════════

import {
  Component,
  Input,
  Output,
  EventEmitter,
  ChangeDetectionStrategy,
} from '@angular/core';
import {
  DateRangePreset,
  FilterCondition,
  FilterOperator,
} from '../../../core/query-types';

export interface DatePickerChange {
  filter: FilterCondition | null;  // null = "All time" (no filter)
  preset: string;                  // '' | DateRangePreset value
  label:  string;                  // human-readable label for period display
}

@Component({
  selector: 'app-widget-date-picker',
  standalone: true,
  imports: [],
  templateUrl: './widget-date-picker.html',
  styleUrl:    './widget-date-picker.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WidgetDatePickerComponent {
  /** Entity whose date field we filter on */
  @Input() entity = '';
  /** Field name (logical) to apply the date range to */
  @Input() field  = '';
  /** Currently selected preset value (pass back for controlled behaviour) */
  @Input() preset = '';
  /** Emitted whenever the user picks a different option */
  @Output() presetChange = new EventEmitter<DatePickerChange>();

  readonly options: { value: string; label: string }[] = [
    { value: '',                          label: 'All time'    },
    { value: DateRangePreset.Today,       label: 'Today'       },
    { value: DateRangePreset.Yesterday,   label: 'Yesterday'   },
    { value: DateRangePreset.Last7Days,   label: 'Last 7 days' },
    { value: DateRangePreset.Last30Days,  label: 'Last 30 days'},
    { value: DateRangePreset.Last90Days,  label: 'Last 90 days'},
    { value: DateRangePreset.ThisMonth,   label: 'This month'  },
    { value: DateRangePreset.LastMonth,   label: 'Last month'  },
    { value: DateRangePreset.ThisYear,    label: 'This year'   },
    { value: DateRangePreset.LastYear,    label: 'Last year'   },
  ];

  onSelect(event: Event): void {
    const value = (event.target as HTMLSelectElement).value;
    const opt   = this.options.find(o => o.value === value) ?? this.options[0];

    const filter: FilterCondition | null = value
      ? {
          entity:    this.entity,
          field:     this.field,
          operator:  FilterOperator.DateRange,
          dateRange: { preset: value as DateRangePreset },
          label:     opt.label,
        }
      : null;

    this.presetChange.emit({ filter, preset: value, label: opt.label });
  }
}
