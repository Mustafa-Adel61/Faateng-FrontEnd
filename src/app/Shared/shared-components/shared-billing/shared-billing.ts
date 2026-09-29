import { SharedPageHeader } from './../../shared-layout/shared-page-header/shared-page-header';
import { DatePipe, DecimalPipe, NgClass, NgFor, NgIf } from '@angular/common';
import { Component, Input } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CreateNewBilling } from '../../../admin/pages/create-new-billing/create-new-billing';
import { ResourceService } from '../../../core/resource.service';
import { Loading } from '../loading/loading';
interface Invoice {
  id?: number;
  selected: boolean;
  Invoice: string;
  Client: string;
  Date: string;         // date string
  Due: string;
  Amount: number;
  Balance?: number;
  Status?: 'Unpaid' | 'Paid' | 'Partially Paid' | string;
  Frequency?: string;
  PaymentTermsDays?: number;
  Project?: string;
  AutoGenerateInvoices?: boolean;
  BillingNumber?: string;
  AmountPerCycle?: number;
  CycleCount?: number;
  ContractTitle?: string;
  UnitNames?: string[];
  EndDate?: string | null;
  photos?: string[];
}
@Component({
  selector: 'app-shared-billing',
  imports: [NgFor, NgIf, FormsModule, CreateNewBilling, NgClass, SharedPageHeader, Loading, DatePipe, DecimalPipe],
  standalone: true,
  templateUrl: './shared-billing.html',
  styleUrl: './shared-billing.css'
})
export class SharedBilling {

  // UI state
  showFilterBuilder = false;
  quickInvoice: string = '';
  quickClient: string = '';
  quickDate: string = '';
  quickDue: string = '';
  quickAmount: string = '';
  quickBalance: string = '';
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
    'Active',
    'Inactive',
  ];
  @Input() role: 'admin' | 'finance' | 'manager' | null = null;

  tasks: Invoice[] = [];
  ngOnInit(): void {
    this.loadTasks();
  }

  constructor(private resourceService: ResourceService) { }
  loading: boolean = false;
  loadTasks() {
    const params: any = {};
    if (this.role) {
      params.role = this.role;
    }
    this.loading = true;
    this.resourceService.getAll('Billings', params).subscribe({
      next: (data: any[]) => {
        this.tasks = data.map(item => ({
          selected: false,
          id: item.id,
          Invoice: `BILL-${item.id}`,
          Client: item.clientName || item.Client || 'Unknown Client',
          Date: item.startDate || item.Date || '',
          Due: item.nextInvoiceDate || item.Due || '',
          EndDate: item.endDate || null,
          Amount: item.amountPerCycle ?? item.amount ?? item.Amount ?? 0,
          Balance: item.isActive ? item.amount || 0 : 0,
          Status: item.isActive ? 'Active' : 'Inactive',
          Frequency: item.frequency || 'OneOff',
          PaymentTermsDays: item.paymentTermsDays || 0,
          Project: item.projectName || '',
          ContractTitle: item.contractTitle || '',
          UnitNames: item.unitNames || [],
          AutoGenerateInvoices: item.autoGenerateInvoices || false,
          AmountPerCycle: item.amountPerCycle || 0,
          CycleCount: item.cycleCount || 1,
          photos: item.photos || []
        }));
        this.loading = false;
      },
      error: (err) => {
        console.error('Failed to load billing schedules', err);
        this.tasks = [];
        this.loading = false;
      }
    });
  }

  loadMockData() {
    if (this.role == 'admin' || 'manager') {
      this.tasks = [
        {
          selected: false,
          Invoice: 'INV-1001',
          Client: 'EU Embassy',
          Date: '2025-10-12',
          Due: '2025-10-30',
          Amount: 12400.00,
          Balance: 600000,
          Status: 'Partially Paid',
          photos: ['assets/images/p2.png', 'assets/images/p3.png', 'assets/images/p4.jpg',
            'assets/images/p1.jpg', 'assets/images/p5.jpg'
          ]
        },
        {
          selected: false,
          Invoice: 'INV-1002',
          Client: 'Carlton Hotel – Damascus',
          Date: '2025-10-15',
          Due: '2025-10-25',
          Amount: 4200.00,
          Balance: 1240000,
          Status: 'Paid',
          photos: ['assets/images/p2.png', 'assets/images/p3.png', 'assets/images/p4.jpg',
          ]
        },
        {
          selected: false,
          Invoice: 'INV-1003',
          Client: 'Al Badya Cement',
          Date: '2025-10-10',
          Due: '2025-10-20',
          Amount: 3840.00,
          Balance: 0.00,
          Status: 'Unpaid',
          photos: ['assets/images/p2.png', 'assets/images/p3.png', 'assets/images/p4.jpg',
            'assets/images/p1.jpg', 'assets/images/p5.jpg'
          ]
        },
        {
          selected: false,
          Invoice: 'INV-1004',
          Client: 'Park Residence',
          Date: '2025-10-18',
          Due: '2025-10-28',
          Amount: 1020.00,
          Balance: 500000,
          Status: 'Partially Paid',
          photos: ['assets/images/p2.png', 'assets/images/p3.png', 'assets/images/p4.jpg',
            'assets/images/p1.jpg', 'assets/images/p5.jpg'
          ]
        },
      ]
    }
    else if (this.role == 'finance') {
      this.tasks = [
        {
          selected: false,
          Invoice: 'INV-1001',
          Client: 'EU Embassy',
          Date: '2025-10-12',
          Due: '2025-10-30',
          Amount: 12400.00,
          Balance: 600000,
          Status: 'Partially Paid',
          photos: ['assets/images/p2.png', 'assets/images/p3.png', 'assets/images/p4.jpg',
            'assets/images/p1.jpg', 'assets/images/p5.jpg'
          ]
        },
        {
          selected: false,
          Invoice: 'INV-1002',
          Client: 'Carlton Hotel – Damascus',
          Date: '2025-10-15',
          Due: '2025-10-25',
          Amount: 4200.00,
          Balance: 1240000,
          Status: 'Paid',
          photos: ['assets/images/p2.png', 'assets/images/p3.png', 'assets/images/p4.jpg',
          ]
        },]
    }
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
    // console.log("Mustafa Adel");

    let result = this.tasks;

    if (this.activeFilters.length) {
      result = result.filter(task =>
        this.activeFilters.every(f => {
          const v = (task as any)[f.field];
          if (v == null) return false;

          console.log(f.field);
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
          else if (f.field === 'Due') {
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
      result = result.filter(task => task.Invoice.toLowerCase().includes(search));
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

  // Realistic filters for billing
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
    else if (this.newFilter.field === 'Due') {
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
      if (removedFilter.field === 'Date') this.quickDate = '';
      if (removedFilter.field === 'Due') this.quickDue = '';
      if (removedFilter.field === 'Amount') this.quickAmount = '';
      if (removedFilter.field === 'Balance') this.quickBalance = '';
      if (removedFilter.field === 'Status') this.quickStatus = '';
    }
    // keep page valid
    if (this.page > this.totalPages) this.page = this.totalPages;
  }

  clearAllFilters() {
    this.activeFilters = [];
    this.quickInvoice = '';
    this.quickClient = '';
    this.quickDate = '';
    this.quickDue = '';
    this.quickAmount = '';
    this.quickBalance = '';
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
      if (this.page > this.totalPages) this.page = this.totalPages;
      this.loading = false;
    } else if (action === 'generate' && task.id) {
      this.loading = true;
      this.resourceService.create(`Billings/${task.id}/generate-invoice`, {}).subscribe({
        next: () => this.loadTasks(),
        error: () => { this.loading = false; }
      });
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
      // Persist to backend
      const payload = { status: task.Status };
      // Assuming 'invoices' endpoint supports update by ID or similar. 
      // If we need ID, we might need to store it. Assuming Invoice Number is unique or we have ID.
      // If we don't have ID, we use Invoice number as ID for now.
      const id = task.id || task.Invoice; 
      this.loading = true;
      this.resourceService.update('invoices', id, payload).subscribe({
        next: () => console.log('Invoice status updated'),
        error: (err) => console.error('Failed to update invoice status', err),
        complete: () => { this.loading = false; }
      });
    }
  }
  forceDatePicker(event: Event) {
    const target = event.target as HTMLInputElement;
    // التأكد أن الدالة موجودة قبل استدعائها
    if (target.showPicker) {
      target.showPicker();
    }
  }


  //create new visit modal logic

  showCreate = false;
  savingSchedule = false;

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


  addTask(newInvoiceData: any) {
    if (this.savingSchedule) return;
    const payload = {
      clientId: newInvoiceData.ClientId,
      title: newInvoiceData.Title,
      amount: newInvoiceData.Amount,
      frequency: newInvoiceData.RecurringEnabled ? newInvoiceData.BillingCycle : 'OneOff',
      paymentTermsDays: newInvoiceData.Terms,
      startDate: newInvoiceData.IssueDate,
      endDate: newInvoiceData.EndDate || null,
      projectId: newInvoiceData.ProjectId,
      autoGenerateInvoices: newInvoiceData.RecurringEnabled
    };

    this.savingSchedule = true;
    this.resourceService.create('Billings/create', payload).subscribe({
      next: (created) => {
        const newInvoice: Invoice = {
          selected: false,
          id: created.id,
          Invoice: created.title || `BILL-${created.id}`,
          Client: newInvoiceData.ClientName,
          Date: created.startDate || payload.startDate,
          Due: created.nextInvoiceDate || payload.startDate,
          Amount: created.amount || payload.amount,
          Status: created.isActive === false ? 'Inactive' : 'Active',
          photos: []
        };
        this.tasks.unshift(newInvoice);
        this.page = 1;
        this.showCreate = false;
        document.body.style.overflow = 'auto';
      },
      error: (err) => {
        console.error('Failed to create invoice', err);
        this.loading = false;
      },
      complete: () => { this.savingSchedule = false; }
    });
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
}
