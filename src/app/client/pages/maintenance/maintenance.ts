import { Component } from '@angular/core';
import { SharedTaskList } from '../../../Shared/shared-components/shared-task-list/shared-task-list';

@Component({
  selector: 'app-maintenance',
  standalone: true,
  imports: [SharedTaskList],
  templateUrl: './maintenance.html',
  styleUrl: './maintenance.css'
})
export class Maintenance {}
