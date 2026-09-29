import { NgClass, NgFor, NgIf, CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output, OnInit } from '@angular/core';
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
 @Input() saving: boolean = false; // Parent-driven: true while the POST is still in flight

 clients: { id: string, name: string }[] = [];
 selectedClientId: string | null = null;
 projects: { id: number, name: string }[] = [];
 selectedProjectId: number | null = null;
  private pendingLoads = 0;



  BillingCycles=['Monthly', 'Quarterly', 'Yearly'];


  // متغيرات الـ Form لتمثيل الحقول في الصورة
  form = {
    Client: '',
    Title: '',
    IssueDate: '',
    EndDate: '',
    Project: '',
    Contract: '',
    BillingCycle: '',
    Amount: 0,
    Terms: 0,
    RecurringEnabled: false,
  };
 
  constructor(private resource: ResourceService) {}
  loading: boolean = false;
  private markLoadingStart() { this.pendingLoads++; this.loading = true; }
  private markLoadingEnd() { this.pendingLoads = Math.max(0, this.pendingLoads - 1); if (this.pendingLoads === 0) this.loading = false; }

 ngOnInit() {
  const today = new Date().toISOString().split('T')[0];
  this.form.IssueDate = today;
  this.form.BillingCycle = 'Monthly';
  this.form.RecurringEnabled = true;
    this.markLoadingStart();
    this.resource.getAll('Users/clients').subscribe({
      next: (list) => {
        this.clients = (list || []).map((c: any) => ({ id: c.id, name: c.name }));
      },
      error: () => { this.clients = []; this.markLoadingEnd(); },
      complete: () => { this.markLoadingEnd(); }
    });
 }

 onClientChange() {
   this.selectedProjectId = null;
   this.projects = [];
   if (!this.selectedClientId) return;
   this.markLoadingStart();
   this.resource.getAll(`Projects?clientId=${encodeURIComponent(this.selectedClientId)}`).subscribe({
     next: (list) => { this.projects = list || []; },
     error: () => { this.projects = []; this.markLoadingEnd(); },
     complete: () => { this.markLoadingEnd(); }
   });
 }

 // الدوال
  doClose() {
    this.close.emit();
  }
 submitted = false;
  doSave() {
    if (this.saving) return;
  this.submitted = true;
    if(
    !this.selectedClientId||
    !this.form.Title||
    !this.form.IssueDate||
    !this.selectedProjectId ||
    !this.form.Amount || this.form.Amount <= 0 ||
    !this.form.Terms || this.form.Terms <= 0 ){
    return; // ❌ يمنع الحفظ 
  }
    // إرسال بيانات الـ Report الجديدة
    const clientName = this.clients.find(c => c.id === this.selectedClientId)?.name || '';
    this.loading = true;
    this.save.emit({ ...this.form, ClientId: this.selectedClientId, ClientName: clientName, ProjectId: this.selectedProjectId });
  }
forceDatePicker(event: Event) {
    const target = event.target as HTMLInputElement;
    // التأكد أن الدالة موجودة قبل استدعائها
    if (target.showPicker) {
      target.showPicker();
    }
  }

}
