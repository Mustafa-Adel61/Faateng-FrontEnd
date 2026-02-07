import { Component } from '@angular/core';
import { SharedBilling } from '../../../Shared/shared-components/shared-billing/shared-billing';


@Component({
  selector: 'app-billing',
  imports: [SharedBilling],
  templateUrl: './billing.html',
  styleUrl: './billing.css'
})
export class Billing { 
}