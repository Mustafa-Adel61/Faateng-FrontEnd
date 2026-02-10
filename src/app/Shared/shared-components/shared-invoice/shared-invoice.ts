import { SharedPageHeader } from './../../shared-layout/shared-page-header/shared-page-header';
import { NgClass, NgFor, NgIf } from '@angular/common';
import { Component, Input, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CreateNewInvoice } from '../../../admin/pages/create-new-invoice/create-new-invoice';
import { ResourceService } from '../../../core/resource.service';
import { ToastService } from '../../services/toast.service';
import { Loading } from '../loading/loading';
interface Invoice {
  selected: boolean;
  Invoice: string;
  Client: string;
  Project: string;
  Date: string;         // date string
  Due: string;
  Amount: number;
  Status?: 'Paid' | 'Overdue' | 'Draft' | 'Pending' | string;
  photos?: string[];
  WorkOrderId?: string;
}
@Component({
  selector: 'app-shared-invoice',
  standalone: true,
  imports: [NgFor, NgIf, FormsModule, NgClass, CreateNewInvoice, SharedPageHeader, Loading],
  templateUrl: './shared-invoice.html',
  styleUrl: './shared-invoice.css'
})
export class SharedInvoice {
  @Input() role: 'admin' | 'manager' | 'finance' | 'client' | null = null;
  private toastService: ToastService = inject(ToastService);
  loading: boolean = false;

  // UI state
  showFilterBuilder = false;
  // ضيفت ال data من والي 
  newFilter = { field: '', value: '', dateFrom: '', dateTo: '' };
  activeFilters: { field: string; value: string; dateFrom?: string; dateTo?: string }[] = [];
  // details panel
  showDetails = false;
  selectedTask: Invoice | null = null;

  // Selection
  allSelected = false;
  //  search text
  searchText: string = '';

  // Pagination
  page = 1;
  pageSize = 10;
  statuses = [
    'Paid',
    'Overdue',
    'Draft',
    'Pending'
  ];

  // Create Invoice
  showCreate = false;

  addTask(newInvoiceData: any) {
    const payload = {
      invoiceNumber: newInvoiceData.Invoice || `INV-${Math.floor(Math.random() * 10000)}`,
      clientId: newInvoiceData.ClientId,
      clientName: newInvoiceData.ClientName,
      projectName: newInvoiceData.Project,
      issueDate: newInvoiceData.Date,
      dueDate: newInvoiceData.Due,
      total: newInvoiceData.Amount || 0,
      workOrderId: newInvoiceData.WorkOrderId || '',
      status: 'Pending',
      photos: []
    };

    this.loading = true;
    this.resource.create('Invoices/create', payload).subscribe({
      next: (created) => {
        const newInvoice: Invoice = {
          selected: false,
          Invoice: created.id ? `INV-${created.id}` : payload.invoiceNumber,
          Client: payload.clientName,
          Project: payload.projectName,
          Date: payload.issueDate,
          Due: created.dueDate || payload.dueDate,
          Amount: created.total || payload.total,
          WorkOrderId: payload.workOrderId,
          Status: created.status || 'Pending',
          photos: []
        };
        this.tasks.unshift(newInvoice);
        this.closeCreate();
        this.loading = false;
      },
      error: (err) => {
        console.error('Failed to create invoice', err);
        // Fallback
        const newInvoice: Invoice = {
          selected: false,
          Invoice: payload.invoiceNumber,
          Client: payload.clientName,
          Project: payload.projectName,
          Date: payload.issueDate,
          Due: payload.dueDate,
          Amount: payload.total,
          WorkOrderId: payload.workOrderId,
          Status: 'Pending',
          photos: []
        };
        this.tasks.unshift(newInvoice);
        this.closeCreate();
        this.loading = false;
      }
    });
  }

  // sample tasks data (enriched with SLA fields etc)
  tasks: Invoice[] = [];
  ngOnInit(): void {
    this.loadTasks();
  }
  loadTasks() {
    const params: Record<string, string> = {};
    if (this.role) params['role'] = this.role as string;
    this.resource.getAll('Invoices', params).subscribe({
      next: (items) => {
        this.tasks = (items || []).map((inv: any) => ({
          selected: false,
          Invoice: inv.invoice || inv.id || '',
          Client: inv.client || '',
          Project: inv.project || '',
          Date: inv.date || '',
          Due: inv.due || '',
          Amount: inv.amount ?? 0,
          Status: inv.status || 'Pending',
          photos: inv.photos || []
        }));
      },
      error: () => {
        if (this.role === 'admin' || 'manager') {
          this.tasks = [
            {
              selected: false,
              Invoice: 'INV-1001',
              Client: 'EU Embassy',
              Project: 'HVAC Retrofit',
              Date: '2025-10-12',
              Due: '2025-10-30',
              Amount: 12400.00,
              Status: 'Pending',
              photos: ['assets/images/p2.png', 'assets/images/p3.png', 'assets/images/p4.jpg',
                'assets/images/p1.jpg', 'assets/images/p5.jpg'
              ]
            },
            {
              selected: false,
              Invoice: 'INV-1002',
              Client: 'Carlton Hotel – Damascus',
              Project: 'Elevator PM',
              Date: '2025-10-15',
              Due: '2025-10-25',
              Amount: 4200.00,
              Status: 'Overdue',
              photos: ['assets/images/p2.png', 'assets/images/p3.png', 'assets/images/p4.jpg',
              ]
            },
            {
              selected: false,
              Invoice: 'INV-1003',
              Client: 'Al Badya Cement',
              Project: 'Fire Pump Repair ',
              Date: '2025-10-10',
              Due: '2025-10-20',
              Amount: 3840.00,
              Status: 'Paid',
              photos: ['assets/images/p2.png', 'assets/images/p3.png', 'assets/images/p4.jpg',
                'assets/images/p1.jpg', 'assets/images/p5.jpg'
              ]
            },
            {
              selected: false,
              Invoice: 'INV-1004',
              Client: 'Park Residence',
              Project: 'Elevator Door Operator',
              Date: '2025-10-18',
              Due: '2025-10-28',
              Amount: 1020.00,
              Status: 'Overdue',
              photos: ['assets/images/p2.png', 'assets/images/p3.png', 'assets/images/p4.jpg',
                'assets/images/p1.jpg', 'assets/images/p5.jpg'
              ]
            },
          ];
        }
        else if (this.role === 'finance') {
          this.tasks = [
            {
              selected: false,
              Invoice: 'INV-1001',
              Client: 'EU Embassy',
              Project: 'HVAC Retrofit',
              Date: '2025-10-12',
              Due: '2025-10-30',
              Amount: 12400.00,
              Status: 'Pending',
              photos: ['assets/images/p2.png', 'assets/images/p3.png', 'assets/images/p4.jpg',
                'assets/images/p1.jpg', 'assets/images/p5.jpg'
              ]
            },
            {
              selected: false,
              Invoice: 'INV-1002',
              Client: 'Carlton Hotel – Damascus',
              Project: 'Elevator PM',
              Date: '2025-10-15',
              Due: '2025-10-25',
              Amount: 4200.00,
              Status: 'Overdue',
              photos: ['assets/images/p2.png', 'assets/images/p3.png', 'assets/images/p4.jpg',
              ]
            }
          ];
        }
      }
    });
  }



  //لاحظ اني حطات قيمتها في ال applayDetails
  mainImage: string = '';
  setMainImage(photoPath: string) {
    this.mainImage = photoPath;
  }
  selectedCount = 0;
  // ---------------- selection ----------------
  toggleAll() {
    this.pagedTasks.forEach(t => (t.selected = this.allSelected));
    this.selectedCount = this.pagedTasks.filter(t => t.selected).length;
  }
  numberOfSelcted: number = 0;
  updateAllSelected() {
    // update global checkbox according to visible (paged) items
    this.allSelected =
      this.pagedTasks.length > 0 &&
      this.pagedTasks.every(t => t.selected);
    // بظبط عدد المحددين
    this.selectedCount = this.pagedTasks.filter(t => t.selected).length;
  }

  // ---------------- pagination / filtered list getters ----------------
  get filteredTasks(): Invoice[] {
    let result = this.tasks;

    if (this.activeFilters.length) {
      result = result.filter(task =>
        this.activeFilters.every(f => {
          const v = (task as any)[f.field];
          if (v == null) return false;

          // ✅ لو الفلتر تاريخ
          if (f.field === 'Date') {
            const taskDate = new Date(task.Date);
            const from = f.dateFrom ? new Date(f.dateFrom) : null;
            const to = f.dateTo ? new Date(f.dateTo) : null;
            if (from && taskDate < from) return false;
            if (to && taskDate > to) return false;
            return true;
          }
          if (f.field === 'Due') {
            const taskDate = new Date(task.Due);
            const from = f.dateFrom ? new Date(f.dateFrom) : null;
            const to = f.dateTo ? new Date(f.dateTo) : null;
            if (from && taskDate < from) return false;
            if (to && taskDate > to) return false;
            return true;
          }

          // باقي الفلاتر العادية
          return String(v).toLowerCase() === String(f.value).toLowerCase();
        })
      );
    }

    // 🔹 فلترة البحث
    if (this.searchText.trim() !== '') {
      const search = this.searchText.toLowerCase();
      result = result.filter(task => task.Project.toLowerCase().includes(search));
    }

    return result;
  }



  get totalPages(): number {
    return Math.max(1, Math.ceil(this.filteredTasks.length / this.pageSize));
  }

  get pagedTasks(): Invoice[] {
    const start = (this.page - 1) * this.pageSize;
    return this.filteredTasks.slice(start, start + this.pageSize);
  }

  get visiblePages(): number[] {
    const pages: number[] = [];
    const maxButtons = 5;
    if (this.totalPages <= maxButtons) {
      for (let i = 1; i <= this.totalPages; i++) pages.push(i);
    } else {
      let start = this.page - Math.floor(maxButtons / 2);
      let end = this.page + Math.floor(maxButtons / 2);
      if (start < 1) {
        start = 1;
        end = maxButtons;
      }
      if (end > this.totalPages) {
        end = this.totalPages;
        start = this.totalPages - maxButtons + 1;
      }
      for (let i = start; i <= end; i++) pages.push(i);
    }
    return pages;
  }

  setPage(p: number) {
    if (p >= 1 && p <= this.totalPages) this.page = p;
  }

  // ---------------- filter builder ----------------
  toggleFilterBuilder() {
    this.showFilterBuilder = !this.showFilterBuilder;
    // reset newFilter
    this.newFilter = { field: '', value: '', dateFrom: '', dateTo: '' };
  }

  getFilterValues(field: string): string[] {
    if (!field) return [];
    const values = this.tasks
      .map(t => (t as any)[field])
      .filter(v => v !== undefined && v !== null)
      .map(v => String(v));
    return Array.from(new Set(values));
  }

  applyFilter() {
    if (!this.newFilter.field) return;

    if (this.newFilter.field === 'Date') {
      if (!this.newFilter.dateFrom && !this.newFilter.dateTo) return;
      this.activeFilters.push({
        field: 'Date',
        value: `${this.newFilter.dateFrom || '...'} → ${this.newFilter.dateTo || '...'}`,
        dateFrom: this.newFilter.dateFrom,
        dateTo: this.newFilter.dateTo
      });
    }
    if (this.newFilter.field === 'Due') {
      if (!this.newFilter.dateFrom && !this.newFilter.dateTo) return;
      this.activeFilters.push({
        field: 'Due',
        value: `${this.newFilter.dateFrom || '...'} → ${this.newFilter.dateTo || '...'}`,
        dateFrom: this.newFilter.dateFrom,
        dateTo: this.newFilter.dateTo
      });
    }
    else if (this.newFilter.value) {
      this.activeFilters.push({ ...this.newFilter });
    }

    this.newFilter = { field: '', value: '', dateFrom: '', dateTo: '' };
    this.showFilterBuilder = false;
    this.page = 1;
  }


  removeFilter(idx: number) {
    this.activeFilters.splice(idx, 1);
    // keep page valid
    if (this.page > this.totalPages) this.page = this.totalPages;
  }

  clearAllFilters() {
    this.activeFilters = [];
    this.page = 1;
  }

  // ---------------- actions ----------------
  performAction(task: Invoice, action: string) {
    if (action === 'view') {
      this.openDetails(task);
    } else if (action === 'delete') {
      if (!confirm(`Delete ${task.Invoice}?`)) return;
      this.loading = true;
      const idx = this.tasks.indexOf(task);
      if (idx >= 0) this.tasks.splice(idx, 1);
      // adjust pagination if needed
      if (this.page > this.totalPages) this.page = this.totalPages;
      this.toastService.show('تم حذف الفاتورة بنجاح', 'success');
      this.loading = false;
    } else if (action === 'pay') {
      if (confirm(`Pay invoice ${task.Invoice} for $${task.Amount}?`)) {
        this.loading = true;
        this.resource.update('Invoices', task.Invoice, { status: 'Paid' }).subscribe({
          next: () => {
            task.Status = 'Paid';
            this.toastService.show('تم الدفع بنجاح', 'success');
            this.loading = false;
          },
          error: () => {
            this.loading = false;
          }
        });
      }
    }
  }

  onSelectChange(task: any, event: Event) {
    const selectElement = event.target as HTMLSelectElement;
    const value = selectElement.value;

    this.performAction(task, value);
  }


  // ---------------- details panel ----------------
  openDetails(task: Invoice) {
    //بحيط القيمه في ال main image عشان ال Details يشتغل صح
    if (task.photos && task.photos.length > 0) {
      this.mainImage = task.photos[0];
    }

    this.selectedTask = task;
    this.showDetails = true;
    // scroll to top so details visible (optional)
    window.scrollTo({ top: 0, behavior: 'smooth' });
    document.body.style.overflow = 'hidden'; // يمنع scroll الصفحة

  }

  closeDetails() {
    this.selectedTask = null;
    this.showDetails = false;
    document.body.style.overflow = 'auto'; // يرجع scroll الصفحة

  }
  getSortedStatuses(current: any) {
    // الحالة الحالية تبقى أول وحدة
    return [current, ...this.statuses.filter(s => s !== current)];
  }

  updateTaskStatus(task: any) {
    const index = this.tasks.findIndex(t => t.Invoice === task.Invoice);
    if (index !== -1) {
      this.tasks[index].Status = task.Status;
    }
    this.loading = true;
    this.resource.update('Invoices', task.Invoice, { status: task.Status }).subscribe({
      next: () => {
        this.toastService.show('تم تحديث حالة الفاتورة', 'success');
        this.loading = false;
      },
      error: () => {
        this.loading = false;
      }
    });
  }
  forceDatePicker(event: Event) {
    const target = event.target as HTMLInputElement;
    // التأكد أن الدالة موجودة قبل استدعائها
    if (target.showPicker) {
      target.showPicker();
    }
  }




  openCreate() {
    this.showCreate = true;
    // ارفع الصفحة لفوق عشان يبان المودال فوق الكل
    window.scrollTo({ top: 0, behavior: 'smooth' });
    document.body.style.overflow = 'hidden'; // يمنع scroll الصفحة

  }
  closeCreate() {
    this.showCreate = false;
    document.body.style.overflow = 'auto'; // يرجع scroll الصفحة

  }




  getStatusCount(status: string): number {
    let count: number = 0;
    if (status == 'total') {
      //هنا انا عملتها علي كله بس عايز اظبطها علي تاريخ الشهر الي الحالي فقط 
      this.tasks.forEach(element => {
        count += element.Amount;
      });
    }
    else {
      this.tasks.forEach(element => {
        if (element.Status === status) {
          count += element.Amount;
        }
      });
    }
    return count;
  }

  constructor(private resource: ResourceService) { }
}
