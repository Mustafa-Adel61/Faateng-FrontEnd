import { Component } from '@angular/core';
import { SharedPageHeader } from '../../../Shared/shared-layout/shared-page-header/shared-page-header';
import { SharedUnits } from '../../../Shared/shared-components/shared-units/shared-units';

@Component({
  selector: 'app-units',
  imports: [SharedPageHeader, SharedUnits],
  templateUrl: './units.html',
  styleUrl: './units.css'
})
export class Units { }
