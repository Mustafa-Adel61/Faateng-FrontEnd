import { NgClass, CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ResourceService } from '../../../core/resource.service';
import { Loading } from '../../../Shared/shared-components/loading/loading';

@Component({
  selector: 'app-create-new-invoice',
  imports: [FormsModule,NgClass,CommonModule, Loading],
  templateUrl: './create-new-invoice.html',
  styleUrls: ['./create-new-invoice.css']
})
export class CreateNewInvoice implements OnInit {

 @Input() workOrder: any = null;
 @Output() close = new EventEmitter<void>();
 @Output() save = new EventEmitter<any>(); // لإرسال بيانات الـ Report الجديدة

 clients: { id: string, name: string }[] = [];
 selectedClientId: string | null = null;
 projects: { id: number, name: string }[] = [];
 selectedProjectId: number | null = null;

 // متغيرات الـ Form لتمثيل الحقول في الصورة
 form = {
    Client: '',
    Project: '',
    Date: '',
    Due: '',
    Amount: 0,
    WorkOrderId: ''
 };

  constructor(private resource: ResourceService) {}
  loading: boolean = false;
  private pendingLoads = 0;
  private markLoadingStart() { this.pendingLoads++; this.loading = true; }
  private markLoadingEnd() { this.pendingLoads = Math.max(0, this.pendingLoads - 1); if (this.pendingLoads === 0) this.loading = false; }

 ngOnInit() {
    this.markLoadingStart();
    this.resource.getAll('Users/clients').subscribe({
      next: (list) => {
        this.clients = (list || []).map((c: any) => ({ id: c.id, name: c.name }));
      },
      error: () => { this.clients = []; },
      complete: () => { this.markLoadingEnd(); }
    });

    this.markLoadingStart();
    this.resource.getAll('Lookups/Projects').subscribe({
      next: (list) => {
        this.projects = list || [];
      },
      error: () => { this.projects = []; },
      complete: () => { this.markLoadingEnd(); }
    });

    if (this.workOrder) {
      this.form.Client = this.workOrder.units || ''; // Best guess for client name from unit/project
      this.form.Project = this.workOrder.name || '';
      this.form.WorkOrderId = this.workOrder.id ? String(this.workOrder.id) : '';
      this.form.Date = new Date().toISOString().split('T')[0];
      // Due date + 30 days
      const due = new Date();
      due.setDate(due.getDate() + 30);
      this.form.Due = due.toISOString().split('T')[0];
    }
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
    !this.selectedProjectId||
    !this.form.Date||
      !this.form.Due
  ){
    return; // ❌ يمنع الحفظ
  }
    // إرسال بيانات الـ Report الجديدة
    const clientName = this.clients.find(c => c.id === this.selectedClientId)?.name || '';
    
    let taskId: number | null = null;
    if (this.form.WorkOrderId) {
        // Remove non-digit characters just in case user types "WO-123"
        const cleanId = this.form.WorkOrderId.toString().replace(/\D/g, '');
        if (cleanId) {
             taskId = parseInt(cleanId, 10);
        }
    }

    this.loading = true;
    this.save.emit({ 
        ...this.form, 
        ClientId: this.selectedClientId, 
        ClientName: clientName,
        ProjectId: this.selectedProjectId,
        TaskId: taskId
    });
  }
forceDatePicker(event: Event) {
    const target = event.target as HTMLInputElement;
    // التأكد أن الدالة موجودة قبل استدعائها
    if (target.showPicker) {
      target.showPicker();
    }
  }

}
