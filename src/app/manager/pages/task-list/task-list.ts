import { Component } from '@angular/core';
import { SharedTaskList } from '../../../Shared/shared-components/shared-task-list/shared-task-list';

@Component({
  selector: 'app-task-list',
  imports: [SharedTaskList],
  templateUrl: './task-list.html',
  styleUrl: './task-list.css'
})
export class TaskList {

}
