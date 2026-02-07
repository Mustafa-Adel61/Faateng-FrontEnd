import { Component } from '@angular/core';
import { SharedInvoice } from "../../../Shared/shared-components/shared-invoice/shared-invoice";

@Component({
  selector: 'app-invoice',
  standalone: true,
  imports: [SharedInvoice],
  templateUrl: './invoice.html',
  styleUrl: './invoice.css'
})
export class Invoice {

}
