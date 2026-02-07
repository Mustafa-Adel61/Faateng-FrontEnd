import { Component } from '@angular/core';

@Component({
  selector: 'app-task-list',
  templateUrl: './task-list.html',
  styleUrls: ['./task-list.css']
})
export class TaskListComponent {
  tasks = [
    { name: 'Demascous Boulevard', units: 'UNIT#27/28', address: 'Address Building 01', due: 'Jan 14 2022', objective: 'Oil & Grease', team: 'Norm 1 + Norm 2' },
    { name: 'Skycraper', units: 'UNIT#10/12', address: 'Address Building 02', due: 'Jan 16 2022', objective: 'Monthly Check-up', team: 'Norm 3' }
  ];
}
