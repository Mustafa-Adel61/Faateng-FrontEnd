import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { SharedTaskList } from '../../../Shared/shared-components/shared-task-list/shared-task-list';

@Component({
  selector: 'app-task-list',
  templateUrl: './task-list.html',
  styleUrls: ['./task-list.css'],
  // standalone: false,
  imports: [ FormsModule,SharedTaskList]
})
export class TaskList  {
 
}
