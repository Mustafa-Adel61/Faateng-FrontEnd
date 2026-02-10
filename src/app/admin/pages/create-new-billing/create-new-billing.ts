import { NgClass, NgFor, NgIf, CommonModule } from '@angular/common';
import { Component, EventEmitter, Output, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ResourceService } from '../../../core/resource.service';
import { Loading } from '../../../Shared/shared-components/loading/loading';

@Component({
  selector: 'app-create-new-billing',
  imports: [FormsModule,NgFor,NgClass,CommonModule, Loading],
  templateUrl: './create-new-billing.html',
  styleUrl: './create-new-billing.css'
})
export class CreateNewBilling implements OnInit {

 @Output() close = new EventEmitter<void>();
 @Output() save = new EventEmitter<any>(); // لإرسال بيانات الـ Report الجديدة

 clients: { id: string, name: string }[] = [];
 selectedClientId: string | null = null;



  BillingCycles=['Monthly', 'Quarterly', 'Yearly'];


  // متغيرات الـ Form لتمثيل الحقول في الصورة
  form = {
    Client: '',
    Title: '',
    IssueDate: '',
    DueDate: '',
    Project: '',
    Contract: '',
    BillingCycle: '',
    Terms: 0,
    RecurringEnabled: false,

 };
 
  constructor(private resource: ResourceService) {}
  loading: boolean = false;

 ngOnInit() {
    this.loading = true;
    this.resource.getAll('Users/clients').subscribe({
      next: (list) => {
        this.clients = (list || []).map((c: any) => ({ id: c.id, name: c.name }));
      },
      error: () => { this.clients = []; },
      complete: () => { this.loading = false; }
    });
 }

 // الدوال
  doClose() {
    this.close.emit();
  }
submitted = false;
  doSave() {
  this.submitted = true;
    if(
    !this.selectedClientId||
    !this.form.Title||
    !this.form.IssueDate||
    !this.form.DueDate ){
    return; // ❌ يمنع الحفظ 
  }
    // إرسال بيانات الـ Report الجديدة
    const clientName = this.clients.find(c => c.id === this.selectedClientId)?.name || '';
    this.loading = true;
    this.save.emit({ ...this.form, ClientId: this.selectedClientId, ClientName: clientName });
  }
forceDatePicker(event: Event) {
    const target = event.target as HTMLInputElement;
    // التأكد أن الدالة موجودة قبل استدعائها
    if (target.showPicker) {
      target.showPicker();
    }
  }

}
