import { Component } from '@angular/core';
import { SharedTaskList } from "../../../Shared/shared-components/shared-task-list/shared-task-list";

@Component({
  selector: 'app-finance-work-orders',
  standalone: true,
  imports: [SharedTaskList],
  templateUrl: './work-orders.html',
  styleUrl: './work-orders.css'
})
export class WorkOrders {

}
