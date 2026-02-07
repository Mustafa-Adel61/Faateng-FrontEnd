
import { Component } from '@angular/core';
import { SharedInvoice } from '../../../Shared/shared-components/shared-invoice/shared-invoice';
@Component({
  selector: 'app-invoices',
  standalone: true,
  imports: [SharedInvoice],
  templateUrl: './invoices.html',
  styleUrl: './invoices.css'
})
export class Invoices {
}
