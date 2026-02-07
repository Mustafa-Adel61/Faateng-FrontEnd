import { Component } from '@angular/core';
import { SharedCalender } from '../../../Shared/shared-components/shared-calender/shared-calender';

@Component({
  selector: 'app-calendar',
  imports: [SharedCalender],
  templateUrl: './calendar.html',
  styleUrl: './calendar.css'
})
export class Calendar {

}
