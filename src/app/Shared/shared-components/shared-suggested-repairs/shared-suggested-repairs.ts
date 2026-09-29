import { SharedPageHeader } from './../../shared-layout/shared-page-header/shared-page-header';
import { NgIf, NgFor, NgClass, CommonModule } from '@angular/common';
import { Component, Input, OnInit, inject } from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';
import { ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CreateNewSuggestedRepair } from "../../../technician/pages/create-new-suggested-repair/create-new-suggested-repair";
import { ResourceService } from '../../../core/resource.service';
import { SidebarNotificationService } from '../../../core/sidebar-notification.service';
import { API_BASE_URL } from '../../../core/api.config';
import { Loading } from '../loading/loading';
import { ToastService } from '../../services/toast.service';

interface MaintenanceReport {
  id?: number | string;
  selected: boolean;
  Code: string;
  ProjectName: string;
  TechnicalName: string;
  UnitType: string;
  Location: string;
  IssueDescription: string;
  SuggestedRepair: string;
  Score: number;
  Priority: 'Critical' | 'High' | 'Medium' | string;
  Status: 'Under Review' | 'Draft' | 'Approved' | 'Rejected' | string;
  hasPhotos?: boolean;
  images?: string[];
}

@Component({
  selector: 'app-shared-suggested-repairs',
  standalone: true,
  imports: [NgIf, NgFor, FormsModule, NgClass, CommonModule, SharedPageHeader, CreateNewSuggestedRepair, Loading],
  templateUrl: './shared-suggested-repairs.html',
  styleUrl: './shared-suggested-repairs.css'
})
export class SharedSuggestedRepairs implements OnInit {

  // UI state
  showFilterBuilder = false;
  newFilter = { field: '', value: '', dateFrom: '', dateTo: '' };
  activeFilters: { field: string; value: string; dateFrom?: string; dateTo?: string }[] = [];

  // 🔹 Quick Filters Models (تمت إضافتها للتوافق مع الـ HTML الجديد)
  quickProject: string = '';
  quickTechnician: string = '';
  quickStatus: string = '';
  quickPriority: string = '';
  quickUnitType: string = '';
  quickLocation: string = '';

  // Details panel
  showDetails = false;
  selectedTask: MaintenanceReport | null = null;
  loadingList = false;
  loadingSave = false;
  loadingDetails = false;
  loadingPhotos = false;
  actionLoading: 'approve' | 'reject' | null = null;
  mainImage: string = '';

  // Selection
  allSelected = false;
  selectedCount = 0;

  // Search text
  searchText: string = '';

  // Pagination
  page = 1;
  pageSize = 10;
  statuses = [
    'Under Review',
    'Draft',
    'Approved',
    'Rejected'
  ];

  @Input() role: 'admin' | 'technician' | 'manager' | null = null;

  private toast: ToastService = inject(ToastService);
  constructor(private resource: ResourceService, private routerNav: Router, private notifications: SidebarNotificationService) { }
  currentUserId: string | null = null;
  currentUserName: string | null = null;

  ngOnInit(): void {
    if (this.role === 'technician') {
      this.resource.getAll('Auth/me').subscribe({
        next: (me: any) => {
          this.currentUserId = me?.id || null;
          this.currentUserName = me?.fullName || me?.userName || null;
          this.loadTask();
        },
        error: () => this.loadTask()
      });
    } else {
      this.loadTask();
    }
  }

  onThumbnailClick(photo: string) {
    this.setMainImage(photo);
  }

  setMainImage(photo: string) {
    this.mainImage = photo;
  }

  openInNewTab(url: string) {
    window.open(url, '_blank');
  }

  private hostBase = API_BASE_URL.replace(/\/api\/?$/, '');
  
  private normalizePhotoUrl(url: string): string {
    if (!url) return '';
    const trimmed = url.trim();
    const isData = /^data:/i.test(trimmed);
    const isHttp = /^https?:\/\//i.test(trimmed);
    if (isData || isHttp) return trimmed;
    if (trimmed.startsWith('/')) return `${this.hostBase}${trimmed}`;
    return `${this.hostBase}/${trimmed}`;
  }

  private parsePhotos(raw: any): string[] {
    if (!raw) return [];
    if (Array.isArray(raw)) return raw;
    const s = String(raw).trim();
    if (!s) return [];
    if (s.startsWith('[')) {
      try {
        const arr = JSON.parse(s);
        return Array.isArray(arr) ? arr : [];
      } catch {
        return [];
      }
    }
    if (s.includes('data:')) {
      const parts = s.split(/,data:/i);
      if (parts.length > 1) {
        const first = parts[0];
        const rest = parts.slice(1).map(p => 'data:' + p);
        return [first, ...rest];
      }
      return [s];
    }
    if (s.includes('||')) return s.split('||');
    if (s.includes(';')) return s.split(';');
    if (s.includes(',http')) {
      const pieces = s.split(',http').map((p, i) => (i === 0 ? p : 'http' + p));
      return pieces;
    }
    return [s];
  }

  tasks: MaintenanceReport[] = [];

  loadTask() {
    const params: Record<string, string> = {};
    if (this.role) params['role'] = this.role;
    this.loadingList = true;
    this.resource.getAll('SuggestedRepairs', params).subscribe({
      next: (items) => {
        this.tasks = (items || []).map((t: any) => ({
          id: t.id,
          selected: false,
          Code: t.id ? `#${t.id}` : '',
          ProjectName: t.projectName || t.taskItem?.unit?.client?.name || 'Unknown Project',
          TechnicalName: t.technicianName || t.taskItem?.assigneeUser?.fullName || 'Unknown Tech',
          UnitType: t.unitModel || t.taskItem?.unit?.model || 'Unknown Unit',
          Location: t.location || t.taskItem?.unit?.client?.address || 'Unknown Location',
          IssueDescription: t.description || '',
          SuggestedRepair: t.title || '',
          Score: (t.score ?? t.cost) || 0,
          Priority: t.priority || t.taskItem?.priority || 'Medium',
          Status: t.status || 'Under Review',
          hasPhotos: !!t.hasPhotos,
          images: this.parsePhotos(t.photos).map((p: string) => this.normalizePhotoUrl(p))
        }));
      },
      error: () => {
        if (this.role === 'admin') {
          this.tasks = [
            { selected: false, Code: '#P1', ProjectName: 'Damascus Boulevard', TechnicalName: 'Atef Shalabi', UnitType: 'Elevator', Location: 'Damascus', IssueDescription: 'Door sensor malfunction', SuggestedRepair: 'Replace IR sensor', Score: 86, Priority: 'Critical', Status: 'Under Review', images: ['assets/images/p2.png'] },
            { selected: false, Code: '#P2', ProjectName: 'MPI factory', TechnicalName: 'Atef Shalabi', UnitType: 'Elevator', Location: 'Damascus', IssueDescription: 'Door sensor malfunction', SuggestedRepair: 'Replace IR sensor', Score: 76, Priority: 'Medium', Status: 'Approved', images: ['assets/images/p2.png'] },
            { selected: false, Code: '#P3', ProjectName: 'EU EmBASSY', TechnicalName: 'Atef Shalabi', UnitType: 'Elevator', Location: 'Damascus', IssueDescription: 'Door sensor malfunction', SuggestedRepair: 'Replace IR sensor', Score: 16, Priority: 'High', Status: 'Approved', images: ['assets/images/p2.png'] },
            { selected: false, Code: '#P4', ProjectName: 'Damascus Boulevard', TechnicalName: 'Atef Shalabi', UnitType: 'Elevator', Location: 'Damascus', IssueDescription: 'Door sensor malfunction', SuggestedRepair: 'Replace IR sensor', Score: 80, Priority: 'Critical', Status: 'Draft', images: ['assets/images/p2.png'] }
          ];
        } else if (this.role === 'technician') {
          this.tasks = [
            { selected: false, Code: '#P1', ProjectName: 'Damascus Boulevard', TechnicalName: 'Atef Shalabi', UnitType: 'Elevator', Location: 'Damascus', IssueDescription: 'Door sensor malfunction', SuggestedRepair: 'Replace IR sensor', Score: 86, Priority: 'Critical', Status: 'Under Review', images: ['assets/images/p2.png'] },
            { selected: false, Code: '#P2', ProjectName: 'MPI factory', TechnicalName: 'Atef Shalabi', UnitType: 'Elevator', Location: 'Damascus', IssueDescription: 'Door sensor malfunction', SuggestedRepair: 'Replace IR sensor', Score: 76, Priority: 'Medium', Status: 'Approved', images: ['assets/images/p2.png'] }
          ];
        }
      },
      complete: () => { this.loadingList = false; }
    });
  }

  // 🔹 التراسل مع زر التفاصيل لتغيير الحالة
  updateStatus(status: 'Approved' | 'Rejected') {
    if (status === 'Approved') {
      this.approve(this.selectedTask);
    } else {
      this.reject(this.selectedTask);
    }
    this.closeDetails();
  }

  approve(task: MaintenanceReport | null) {
    if (!task || this.actionLoading !== null) return;
    const id = task.id || String(task.Code).replace('#', '');
    this.loadingSave = true;
    this.actionLoading = 'approve';
    this.resource.update('SuggestedRepairs', id + '/approve', {}).subscribe({
      next: () => {
        task.Status = 'Approved';
        this.toast.show('Suggested repair approved successfully!', 'success');
        this.notifications.refreshNow();
        this.loadTask();
      },
      error: () => {
        this.toast.show('Failed to approve suggested repair', 'error');
      },
      complete: () => { this.loadingSave = false; this.actionLoading = null; }
    });
  }

  reject(task: MaintenanceReport | null) {
    if (!task || this.actionLoading !== null) return;
    const id = task.id || String(task.Code).replace('#', '');
    this.loadingSave = true;
    this.actionLoading = 'reject';
    this.resource.update('SuggestedRepairs', id + '/reject', {}).subscribe({
      next: () => {
        task.Status = 'Rejected';
        this.toast.show('Suggested repair rejected successfully!', 'success');
        this.notifications.refreshNow();
        this.loadTask();
      },
      error: () => {
        this.toast.show('Failed to reject suggested repair', 'error');
      },
      complete: () => { this.loadingSave = false; this.actionLoading = null; }
    });
  }

  // Selection
  toggleAll() {
    this.pagedTasks.forEach(t => (t.selected = this.allSelected));
    this.selectedCount = this.pagedTasks.filter(t => t.selected).length;
  }

  updateAllSelected() {
    this.allSelected = this.pagedTasks.length > 0 && this.pagedTasks.every(t => t.selected);
    this.selectedCount = this.pagedTasks.filter(t => t.selected).length;
  }

  // Getters & Pagination
  get filteredTasks(): MaintenanceReport[] {
    let result = this.tasks;

    if (this.activeFilters.length) {
      result = result.filter(task =>
        this.activeFilters.every(f => {
          const v = (task as any)[f.field];
          if (v == null) return false;
          
          if (f.field === 'Location') {
            return String(v).toLowerCase().includes(String(f.value).toLowerCase());
          }
          return String(v).toLowerCase() === String(f.value).toLowerCase();
        })
      );
    }

    if (this.searchText.trim() !== '') {
      const search = this.searchText.toLowerCase();
      result = result.filter(task =>
        task.ProjectName.toLowerCase().includes(search) ||
        task.TechnicalName.toLowerCase().includes(search) ||
        task.IssueDescription.toLowerCase().includes(search)
      );
    }

    return result;
  }

  get totalPages(): number {
    return Math.max(1, Math.ceil(this.filteredTasks.length / this.pageSize));
  }

  get pagedTasks(): MaintenanceReport[] {
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

  // Filter Builder Panel Controls
  toggleFilterBuilder() {
    this.showFilterBuilder = !this.showFilterBuilder;
  }

  getFilterValues(field: string): string[] {
    if (!field) return [];
    const values = this.tasks
      .map(t => (t as any)[field])
      .filter(v => v !== undefined && v !== null && v !== '')
      .map(v => String(v));
    return Array.from(new Set(values));
  }

  // 🔹 تطبيق الفلاتر السريعة تلقائياً
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

  removeFilter(idx: number) {
    const removedFilter = this.activeFilters[idx];
    this.activeFilters.splice(idx, 1);
    
    // إعادة تعيين قيمة المتغير في الشبكة
    if (removedFilter) {
      if (removedFilter.field === 'ProjectName') this.quickProject = '';
      if (removedFilter.field === 'TechnicalName') this.quickTechnician = '';
      if (removedFilter.field === 'Status') this.quickStatus = '';
      if (removedFilter.field === 'Priority') this.quickPriority = '';
      if (removedFilter.field === 'UnitType') this.quickUnitType = '';
      if (removedFilter.field === 'Location') this.quickLocation = '';
    }

    if (this.page > this.totalPages) this.page = this.totalPages;
  }

  clearAllFilters() {
    this.activeFilters = [];
    this.quickProject = '';
    this.quickTechnician = '';
    this.quickStatus = '';
    this.quickPriority = '';
    this.quickUnitType = '';
    this.quickLocation = '';
    this.page = 1;
  }

  // Actions
  performAction(task: MaintenanceReport, action: string) {
    if (action === 'view') {
      this.openDetails(task);
    } else if (action === 'delete') {
      if (!confirm(`Delete ${task.Code}?`)) return;
      const id = String(task.id || task.Code).replace('#', '');
      this.resource.delete('SuggestedRepairs', id).subscribe({
        next: () => {
          const idx = this.tasks.indexOf(task);
          if (idx >= 0) this.tasks.splice(idx, 1);
          if (this.page > this.totalPages) this.page = this.totalPages;
          this.toast.show('Suggested repair deleted successfully!', 'success');
        },
        error: (err) => {
          this.toast.show('Failed to delete item', 'error');
          console.error('Delete SuggestedRepair failed', err);
        }
      });
    }
  }

  onSelectChange(task: any, event: Event) {
    const selectElement = event.target as HTMLSelectElement;
    const value = selectElement.value;
    if (value) {
      this.performAction(task, value);
      selectElement.value = '';
    }
  }

  // Details Modal
  openDetails(task: MaintenanceReport) {
    this.selectedTask = task;
    this.mainImage = task.images && task.images.length > 0 ? task.images[0] : '';
    this.showDetails = true;
    document.body.style.overflow = 'hidden';

    // The list endpoint intentionally omits the base64 photos (they are megabytes per row),
    // so fetch them only for the opened record, and only when the list says there are any.
    if (task.id != null && task.hasPhotos !== false && !(task.images && task.images.length > 0)) {
      this.loadingPhotos = true;
      this.resource.getById('SuggestedRepairs', task.id).subscribe({
        next: (detail: any) => {
          if (!this.selectedTask || this.selectedTask.id !== task.id) return;
          const images = this.parsePhotos(detail?.photos).map((p: string) => this.normalizePhotoUrl(p));
          this.selectedTask = { ...this.selectedTask, images };
          this.mainImage = images.length ? images[0] : '';
          this.loadingPhotos = false;
        },
        error: () => { this.loadingPhotos = false; }
      });
    }
  }

  closeDetails() {
    this.selectedTask = null;
    this.showDetails = false;
    this.loadingPhotos = false;
    this.mainImage = '';
    document.body.style.overflow = 'auto';
  }

  getStatusCount(status: string): number {
    return this.tasks.filter(t => t.Status === status).length;
  }

  getPriorityCount(priority: string): number {
    return this.tasks.filter(t => t.Priority === priority).length;
  }

  // Create Modal Controls
  showCreateReportModal: boolean = false;
  savingNewReport: boolean = false;

  openCreateReport() {
    this.showCreateReportModal = true;
    document.body.style.overflow = 'hidden';
  }

  closeCreateReport() {
    this.showCreateReportModal = false;
    document.body.style.overflow = 'auto';
  }

  saveNewReport(newReportData: any) {
    if (this.savingNewReport) return;
    const payload = {
      projectName: newReportData.ProjectName,
      unitId: newReportData.UnitId,
      issueDescription: newReportData.IssueDescription,
      suggestedRepair: newReportData.SuggestedRepair,
      score: newReportData.Score,
      priority: newReportData.Priority,
      status: newReportData.Status,
      images: newReportData.images || []
    };

    this.savingNewReport = true;
    this.resource.create('SuggestedRepairs', payload).subscribe({
      next: () => {
        this.toast.show('Suggested Repair created successfully', 'success');
        this.closeCreateReport();
        this.loadTask();
      },
      error: () => {
        this.toast.show('Failed to create Suggested Repair', 'error');
        this.closeCreateReport();
      },
      complete: () => { this.savingNewReport = false; }
    });
  }
}