import { NgIf, NgFor, NgClass } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { SharedPageHeader } from '../../../Shared/shared-layout/shared-page-header/shared-page-header';
import { CreateNewReport } from "../create-new-report/create-new-report";
import { ResourceService } from '../../../core/resource.service';
interface Task {
    id?: number;
    selected: boolean;
    Report:string;
  	Visit:string[];
    Site_Unit:string;
    Template:string;	
    Tech:string;
    Date:string;	
    Score?:number;
    Critical?:number;	
    Status?:'Submitted' | 'Returned' | 'Approved' | string; 	
    images?:string[];
}
@Component({
  selector: 'app-reports-review-queue',
  imports: [FormsModule, NgIf, NgFor, NgClass, SharedPageHeader, CreateNewReport],
  templateUrl: './reports-review-queue.html',
  styleUrl: './reports-review-queue.css'
})
export class ReportsReviewQueue {
  showCreateReportModal: boolean = false;  
  // UI state
  showFilterBuilder = false;
  // ضيفت ال data من والي 
  newFilter = { field: '', value: '', dateFrom: '', dateTo: '' };
  activeFilters: { field: string; value: string; dateFrom?: string; dateTo?: string }[] = [];
  // details panel
  showDetails = false;
  selectedTask: Task | null = null;

  // Selection
  allSelected = false;
 //  search text
  searchText: string = '';

  // Pagination
  page = 1;
  pageSize = 10;
  statuses = [
  'Submitted',
  'Returned',
  'Approved',
];

  // sample tasks data (enriched with SLA fields etc)
  tasks: Task[] = [];

  // constructor: init map url
 

  ngOnInit(): void {
    this.loadReports();
  }
  
  constructor(private resource: ResourceService) {}
  
  private loadReports() {
    this.resource.getAll('Reports').subscribe({
      next: (items) => {
        this.tasks = (items || []).map((r: any) => ({
          id: r.id,
          selected: false,
          Report: r.reportId,
          Visit: Array.isArray(r.maintenanceVisits) ? r.maintenanceVisits : (typeof r.maintenanceVisits === 'string' && r.maintenanceVisits ? JSON.parse(r.maintenanceVisits) : []),
          Site_Unit: r.unit?.name || r.unitId || '',
          Template: r.comments || r.workPerformed || '',
          Tech: r.technicianName || '',
          Date: r.date ? new Date(r.date).toLocaleDateString() : '',
          Score: 0,
          Critical: 0,
          Status: r.status,
          images: Array.isArray(r.photos) ? r.photos : (typeof r.photos === 'string' && r.photos ? String(r.photos).split(',') : [])
        }));
      },
      error: () => {
        this.tasks = [];
      }
    });
  }
  selectedCount=0;
  // ---------------- selection ----------------
  toggleAll() {
    this.pagedTasks.forEach(t => (t.selected = this.allSelected));
    this.selectedCount=this.pagedTasks.filter(t => t.selected).length;
  }
numberOfSelcted:number=0;
  updateAllSelected() {
    // update global checkbox according to visible (paged) items
    this.allSelected =
      this.pagedTasks.length > 0 &&
      this.pagedTasks.every(t => t.selected);
      // بظبط عدد المحددين
      this.selectedCount=this.pagedTasks.filter(t => t.selected).length;
  }

  // ---------------- pagination / filtered list getters ----------------
get filteredTasks(): Task[] {
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

        // باقي الفلاتر العادية
        return String(v).toLowerCase() === String(f.value).toLowerCase();
      })
    );
  }

  // 🔹 فلترة البحث
  if (this.searchText.trim() !== '') {
    const search = this.searchText.toLowerCase();
    result = result.filter(task => task.Site_Unit.toLowerCase().includes(search));
  }

  return result;
}



  get totalPages(): number {
    return Math.max(1, Math.ceil(this.filteredTasks.length / this.pageSize));
  }

  get pagedTasks(): Task[] {
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
  } else if (this.newFilter.value) {
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
  performAction(task: Task, action: string) {
    if (action === 'view') {
      this.openDetails(task);
    } else if (action === 'delete') {
      if (!confirm(`Delete ${task.Report}?`)) return;
      if (!task.id) return;
      this.resource.delete('Reports', task.id).subscribe({
        next: () => {
          const idx = this.tasks.indexOf(task);
          if (idx >= 0) this.tasks.splice(idx, 1);
          if (this.page > this.totalPages) this.page = this.totalPages;
        },
        error: (err) => {
          alert('Not authorized or failed to delete');
          console.error('Delete Report failed', err);
        }
      });
    }
  }

  onSelectChange(task: any, event: Event) {
  const selectElement = event.target as HTMLSelectElement;
  const value = selectElement.value;

  this.performAction(task, value);
}


  // ---------------- details panel ----------------
  openDetails(task: Task) {
    this.selectedTask = task;
    this.showDetails = true;
    // scroll to top so details visible (optional)
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  closeDetails() {
    this.selectedTask = null;
    this.showDetails = false;
  }
  getSortedStatuses(current: any) {
  // الحالة الحالية تبقى أول وحدة
  return [current, ...this.statuses.filter(s => s !== current)];
}

  updateTaskStatus(task: any) {
    const index = this.tasks.findIndex(t => t.Report === task.Report);
    if (index === -1) return;
    const selected = String(task.Status);
    if (selected === 'Approved' && task.id) {
      this.resource.update('Reports', task.id + '/approve', {}).subscribe(() => {
        this.tasks[index].Status = 'Approved';
      });
    } else if (selected === 'Returned' && task.id) {
      this.resource.update('Reports', task.id + '/reject', {}).subscribe(() => {
        this.tasks[index].Status = 'Returned';
      });
    } else {
      this.tasks[index].Status = selected;
    }
  }
  forceDatePicker(event: Event) {
    const target = event.target as HTMLInputElement;
    // التأكد أن الدالة موجودة قبل استدعائها
    if (target.showPicker) {
      target.showPicker();
    }
  }
 openCreateReport() {
    this.showCreateReportModal = true;
      document.body.style.overflow = 'hidden'; // يمنع scroll الصفحة

  }
  // 4. دالة لإغلاق الـ Modal
  closeCreateReport() {
    this.showCreateReportModal = false;
      document.body.style.overflow = 'auto'; // يرجع scroll الصفحة
  }
  // 5. دالة لحفظ الـ Report الجديد وإضافته للجدول
  // 5. دالة لحفظ الـ Report الجديد وإضافته للجدول
  saveNewReport(newReportData: any) {
    const payload = {
      date: newReportData.date ? new Date(newReportData.date).toISOString() : undefined,
      technicianUserId: newReportData.assignedTechnician || null,
      technicianName: newReportData.assignedTechnicianName || newReportData.technician || '',
      unitId: newReportData.systemId ? Number(newReportData.systemId) : null,
      comments: newReportData.comments || '',
      workPerformed: newReportData.workPerformed || '',
      photos: Array.isArray(newReportData.photos) ? newReportData.photos : [],
      maintenanceVisits: newReportData.maintenanceVisits ? [newReportData.maintenanceVisits] : []
    };
    this.resource.create('Reports', payload).subscribe({
      next: (created) => {
        const newReport: Task = {
          id: created.id,
          selected: false,
          Report: created.reportId,
          Date: created.date ? new Date(created.date).toLocaleDateString() : '',
          Visit: Array.isArray(created.maintenanceVisits) ? created.maintenanceVisits : (created.maintenanceVisits ? JSON.parse(created.maintenanceVisits) : []),
          Tech: created.technicianName || '',
          Template: created.comments || created.workPerformed || '',
          Site_Unit: created.unit?.name || created.unitId || '',
          Critical: 0,
          Score: 0,
          Status: created.status,
          images: Array.isArray(created.photos) ? created.photos : (created.photos ? String(created.photos).split(',') : [])
        };
        this.tasks.unshift(newReport);
        this.closeCreateReport();
        document.body.style.overflow = 'auto';
      },
      error: () => {
        this.closeCreateReport();
        document.body.style.overflow = 'auto';
      }
    });
  }
}
