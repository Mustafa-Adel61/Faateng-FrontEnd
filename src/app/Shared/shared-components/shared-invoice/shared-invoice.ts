import { SharedPageHeader } from './../../shared-layout/shared-page-header/shared-page-header';
import { CommonModule } from '@angular/common';
import { Component, Input, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CreateNewInvoice } from '../../../admin/pages/create-new-invoice/create-new-invoice';
import { ResourceService } from '../../../core/resource.service';
import { SidebarNotificationService } from '../../../core/sidebar-notification.service';
import { ToastService } from '../../services/toast.service';
import { Loading } from '../loading/loading';

interface Invoice {
  id?: number;
  selected: boolean;
  Invoice: string;
  Client: string;
  Project: string;
  Date: string;         // date string
  Due: string;
  Amount: number;
  PaidAmount?: number;
  Balance?: number;
  Status?: 'Paid' | 'Overdue' | 'Draft' | 'Pending' | string;
  photos?: string[];
  WorkOrderId?: string;
  ContractTitle?: string;
  UnitNames?: string[];
}
@Component({
  selector: 'app-shared-invoice',
  standalone: true,
  imports: [CommonModule, FormsModule, CreateNewInvoice, SharedPageHeader, Loading],
  templateUrl: './shared-invoice.html',
  styleUrl: './shared-invoice.css'
})
export class SharedInvoice {
  @Input() role: 'admin' | 'manager' | 'finance' | 'client' | null = null;
  private toastService: ToastService = inject(ToastService);
  loading: boolean = false;

  // UI state
  showFilterBuilder = false;
  quickInvoice: string = '';
  quickClient: string = '';
  quickProject: string = '';
  quickDate: string = '';
  quickDue: string = '';
  quickAmount: string = '';
  quickStatus: string = '';
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
    'PartiallyPaid',
    'Sent',
    'Overdue',
    'Draft',
  ];

  // Create Invoice
  showCreate = false;
  savingInvoice = false;

  addTask(newInvoiceData: any) {
    if (this.savingInvoice) return;
    const payload = {
      clientId: newInvoiceData.ClientId,
      clientName: newInvoiceData.ClientName,
      projectName: newInvoiceData.Project,
      issueDate: newInvoiceData.Date,
      dueDate: newInvoiceData.Due,
      total: newInvoiceData.Amount || 0,
      projectId: newInvoiceData.ProjectId,
      taskId: newInvoiceData.TaskId,
      workOrderId: newInvoiceData.WorkOrderId || '',
      status: 'Draft',
      photos: []
    };

    this.savingInvoice = true;
    this.loading = true;
    this.resource.create('Invoices/create', payload).subscribe({
      next: (created) => {
        const newInvoice: Invoice = {
          id: created.id,
          selected: false,
          Invoice: created.invoiceNumber || `INV-${created.id}`,
          Client: payload.clientName,
          Project: payload.projectName,
          Date: payload.issueDate,
          Due: created.dueDate || payload.dueDate,
          Amount: created.total || payload.total,
          Balance: (created.total || payload.total) - (created.paidAmount || 0),
          PaidAmount: created.paidAmount || 0,
          WorkOrderId: payload.workOrderId,
          Status: created.status || 'Pending',
          photos: []
        };
        this.tasks.unshift(newInvoice);
        this.closeCreate();
        this.loading = false;
        //-badge الفاتورة الجديدة في الـ header والـ sidebar
        this.notifications.refreshNow();
      },
      error: (err) => {
        console.error('Failed to create invoice', err);
        this.loading = false;
      },
      complete: () => { this.savingInvoice = false; }
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
    this.loading = true;
    this.resource.getAll('Invoices', params).subscribe({
      next: (items) => {
        this.tasks = (items || []).map((inv: any) => ({
          id: inv.id,
          selected: false,
          Invoice: `INV-${inv.id}`,
          Client: inv.clientName || '',
          Project: inv.projectName || '',
          ContractTitle: inv.contractTitle || '',
          UnitNames: inv.unitNames || [],
          Date: inv.issueDate || '',
          Due: inv.dueDate || '',
          Amount: inv.total ?? 0,
          Balance: inv.balance ?? (inv.total ?? 0) - (inv.paidAmount || 0),
          PaidAmount: inv.paidAmount || 0,
          Status: inv.status || 'Draft',
          photos: inv.photos || []
        }));
        if (this.selectedTask?.id != null) {
          this.selectedTask = this.tasks.find(task => task.id === this.selectedTask?.id) || null;
        }
      },
      error: () => {
        this.tasks = [];
        /*
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
        */
        this.loading = false;
      },
      complete: () => { this.loading = false; }
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
            if (f.dateFrom || f.dateTo) {
              const taskDate = new Date(task.Date);
              const from = f.dateFrom ? new Date(f.dateFrom) : null;
              const to = f.dateTo ? new Date(f.dateTo) : null;
              if (from && taskDate < from) return false;
              if (to && taskDate > to) return false;
              return true;
            }
            return String(v).toLowerCase() === String(f.value).toLowerCase();
          }
          if (f.field === 'Due') {
            if (f.dateFrom || f.dateTo) {
              const taskDate = new Date(task.Due);
              const from = f.dateFrom ? new Date(f.dateFrom) : null;
              const to = f.dateTo ? new Date(f.dateTo) : null;
              if (from && taskDate < from) return false;
              if (to && taskDate > to) return false;
              return true;
            }
            return String(v).toLowerCase() === String(f.value).toLowerCase();
          }

          // باقي الفلاتر العادية
          return String(v).toLowerCase() === String(f.value).toLowerCase();
        })
      );
    }

    // 🔹 فلترة البحث
    if (this.searchText.trim() !== '') {
      const search = this.searchText.toLowerCase();
      result = result.filter(task => (task.Project || '').toLowerCase().includes(search));
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

  applyQuickFilter(field: string, value: string) {
    if (!value) {
      this.activeFilters = this.activeFilters.filter(f => f.field !== field);
    } else {
      const existingIndex = this.activeFilters.findIndex(f => f.field === field);
      if (existingIndex > -1) {
        this.activeFilters[existingIndex].value = value;
      } else {
        this.activeFilters.push({ field, value });
      }
    }
    this.page = 1;
  }

  // Realistic filters for invoices
  getFilterValues(field: string): string[] {
    if (!field) return [];
    const values = this.tasks
      .map(t => (t as any)[field])
      .filter(v => v !== undefined && v !== null && v !== '')
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
    const removedFilter = this.activeFilters[idx];
    this.activeFilters.splice(idx, 1);
    if (removedFilter) {
      if (removedFilter.field === 'Invoice') this.quickInvoice = '';
      if (removedFilter.field === 'Client') this.quickClient = '';
      if (removedFilter.field === 'Project') this.quickProject = '';
      if (removedFilter.field === 'Date') this.quickDate = '';
      if (removedFilter.field === 'Due') this.quickDue = '';
      if (removedFilter.field === 'Amount') this.quickAmount = '';
      if (removedFilter.field === 'Status') this.quickStatus = '';
    }
    // keep page valid
    if (this.page > this.totalPages) this.page = this.totalPages;
  }

  clearAllFilters() {
    this.activeFilters = [];
    this.quickInvoice = '';
    this.quickClient = '';
    this.quickProject = '';
    this.quickDate = '';
    this.quickDue = '';
    this.quickAmount = '';
    this.quickStatus = '';
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
      this.toastService.show('Invoice deleted successfully', 'success');
      this.loading = false;
    } else if (action === 'pay') {
      if (confirm(`Pay invoice ${task.Invoice} for $${task.Amount}?`)) {
        this.loading = true;
        this.resource.update('Invoices', `${task.id}/status`, { status: 'Paid' }).subscribe({
          next: () => {
            task.Status = 'Paid';
            this.toastService.show('Payment completed successfully', 'success');
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
    selectElement.selectedIndex = 0;
    selectElement.value = '';
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
    this.resource.update('Invoices', `${task.id}/status`, { status: task.Status }).subscribe({
      next: () => {
        this.toastService.show('Invoice status updated', 'success');
        this.loadTasks();
        //مايبقاش تظهر في الـ notifications بعد ما تتدفع
        this.notifications.refreshNow();
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
    const now = new Date();
    return this.tasks
      .filter(invoice => status === 'total'
        ? (() => { const date = new Date(invoice.Date); return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear(); })()
        : invoice.Status === status)
      .reduce((total, invoice) => total + invoice.Amount, 0);
  }

  get totalInvoiceCount(): number {
    return this.tasks.length;
  }

  get totalPaidAmount(): number {
    return this.tasks.reduce((total, invoice) => total + (invoice.PaidAmount || 0), 0);
  }

  get totalOutstandingAmount(): number {
    return this.tasks.reduce((total, invoice) => total + (invoice.Balance || 0), 0);
  }

  get totalOverdueAmount(): number {
    return this.tasks
      .filter(invoice => invoice.Status === 'Overdue')
      .reduce((total, invoice) => total + (invoice.Balance || 0), 0);
  }

  constructor(private resource: ResourceService, private notifications: SidebarNotificationService) { }
}
