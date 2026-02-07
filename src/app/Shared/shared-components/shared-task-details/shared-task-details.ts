import { Component, EventEmitter, Input, Output } from '@angular/core';
import { NgIf, NgFor, NgClass } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-shared-task-details',
  standalone: true,
  imports: [NgIf, NgFor, FormsModule,NgClass],
  templateUrl: './shared-task-details.html',
  styleUrl: './shared-task-details.css'
})
export class SharedTaskDetails {
  @Input() visible: boolean = false;
  @Input() task: any = null;
  @Input() statuses: string[] = [];
  @Output() close = new EventEmitter<void>();
  @Output() changeStatus = new EventEmitter<string>();

  onClose() { this.close.emit(); }
  onStatusChange() {
    const s = this.task?.status || 'Scheduled';
    this.changeStatus.emit(s);
  }
}

