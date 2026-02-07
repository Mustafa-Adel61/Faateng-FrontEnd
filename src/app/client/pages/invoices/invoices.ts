import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { NgFor, NgIf } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { DomSanitizer } from '@angular/platform-browser';
import { TaskList } from "../../../admin/pages/task-list/task-list";
import { Units } from "../units/units";
import { SharedInvoice } from "../../../Shared/shared-components/shared-invoice/shared-invoice";

@Component({
  selector: 'app-invoices',
  standalone: true,
  imports: [FormsModule, NgIf, NgFor, SharedInvoice],
  templateUrl: './invoices.html',
  styleUrl: './invoices.css'
})
export class Invoices {

  activeTab: 'list' | 'map' = 'list';
  
  constructor(
    private route: ActivatedRoute
  ) { }

  ngOnInit() {
    this.route.queryParams.subscribe(params => {
      const tab = params['tab'];
      this.activeTab = tab === 'map' ? 'map' : 'list';
    });
  }
}
