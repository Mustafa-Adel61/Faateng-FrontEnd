import { Component } from '@angular/core';
import { SharedUnits } from "../../../Shared/shared-components/shared-units/shared-units";

@Component({
  selector: 'app-units',
  standalone: true,
  imports: [SharedUnits],
  templateUrl: './units.html',
  styleUrl: './units.css'
})
export class Units {

}
