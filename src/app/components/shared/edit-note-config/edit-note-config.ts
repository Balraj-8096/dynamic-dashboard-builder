import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { NoteConfig } from '../../../core/interfaces';

@Component({
  selector: 'app-edit-note-config',
  imports: [CommonModule, FormsModule],
  templateUrl: './edit-note-config.html',
  styleUrl: '../config-panels/config-panels.scss',
})
export class EditNoteConfig {
  @Input({ required: true }) cfg!: NoteConfig;
  @Output() cfgChange = new EventEmitter<NoteConfig>();

  readonly fontSizes = ['11', '12', '13', '14', '15', '16'];

  upd(key: keyof NoteConfig, value: any): void {
    this.cfgChange.emit({ ...this.cfg, [key]: value });
  }
}

