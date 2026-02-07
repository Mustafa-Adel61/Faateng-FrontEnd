import { SharedPageHeader } from './../../shared-layout/shared-page-header/shared-page-header';
import { NgIf, NgFor, NgClass, CommonModule } from '@angular/common';
import { Component, Input, OnInit } from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';
import { ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CreateNewSuggestedRepair } from "../../../technician/pages/create-new-suggested-repair/create-new-suggested-repair";
import { ResourceService } from '../../../core/resource.service';
interface MaintenanceReport {
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
  Status: 'Under Review' | 'Draft' | 'Approved' | string;
  images?: string[];

}
@Component({
  selector: 'app-shared-suggested-repairs',
  standalone: true,
  imports: [NgIf, NgFor, FormsModule, NgClass, CommonModule, SharedPageHeader, CreateNewSuggestedRepair],
  templateUrl: './shared-suggested-repairs.html',
  styleUrl: './shared-suggested-repairs.css'
})
export class SharedSuggestedRepairs {

  // UI state
  showFilterBuilder = false;
  // ضيفت ال data من والي 
  newFilter = { field: '', value: '', dateFrom: '', dateTo: '' };
  activeFilters: { field: string; value: string; dateFrom?: string; dateTo?: string }[] = [];
  // details panel
  showDetails = false;
  selectedTask: MaintenanceReport | null = null;

  // Selection
  allSelected = false;
  //  search text
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

  constructor(private resource: ResourceService, private routerNav: Router) { }
  ngOnInit(): void {
    this.loadTask();
  }
  tasks: MaintenanceReport[] = [];
  loadTask() {
    const params: Record<string, string> = {};
    if (this.role) params['role'] = this.role;
    this.resource.getAll('SuggestedRepairs', params).subscribe({
      next: (items) => {
        this.tasks = (items || []).map((t: any) => ({
          selected: false,
          Code: t.id ? `#${t.id}` : '',
          ProjectName: t.taskItem?.unit?.client?.name || 'Unknown Project',
          TechnicalName: t.technicianName || t.taskItem?.assigneeUser?.fullName || 'Unknown Tech',
          UnitType: t.taskItem?.unit?.model || 'Unknown Unit',
          Location: t.taskItem?.unit?.client?.address || 'Unknown Location',
          IssueDescription: t.description || '',
          SuggestedRepair: t.title || '',
          Score: t.cost || 0, // Using Cost as Score/Value
          Priority: t.taskItem?.priority || 'Medium',
          Status: t.status || 'Pending',
          images: t.photos ? t.photos.split(',') : []
        }));
      },
      error: () => {
        // Fallback (keep existing mock data logic)
        if (this.role === 'admin') {
          this.tasks = [
            { selected: false, Code: '#P1', ProjectName: 'Damascus Boulevard', TechnicalName: 'Atef Shalabi', UnitType: 'Elevator', Location: 'Damascus', IssueDescription: 'Door sensor malfunction', SuggestedRepair: 'Replace IR sensor', Score: 86, Priority: 'Critical', Status: 'Under Review', images: ['assets/images/p2.png', 'assets/images/p3.png', 'assets/images/p4.jpg', 'assets/images/p1.jpg', 'assets/images/p5.jpg'] },
            { selected: false, Code: '#P2', ProjectName: 'MPI factory', TechnicalName: 'Atef Shalabi', UnitType: 'Elevator', Location: 'Damascus', IssueDescription: 'Door sensor malfunction', SuggestedRepair: 'Replace IR sensor', Score: 76, Priority: 'Medium', Status: 'Approved', images: ['assets/images/p2.png', 'assets/images/p3.png', 'assets/images/p4.jpg', 'assets/images/p1.jpg', 'assets/images/p5.jpg'] },
            { selected: false, Code: '#P1', ProjectName: 'EU EmBASSY', TechnicalName: 'Atef Shalabi', UnitType: 'Elevator', Location: 'Damascus', IssueDescription: 'Door sensor malfunction', SuggestedRepair: 'Replace IR sensor', Score: 16, Priority: 'High', Status: 'Approved', images: ['assets/images/p2.png', 'assets/images/p3.png', 'assets/images/p4.jpg', 'assets/images/p1.jpg', 'assets/images/p5.jpg'] },
            { selected: false, Code: '#P2', ProjectName: 'Damascus Boulevard', TechnicalName: 'Atef Shalabi', UnitType: 'Elevator', Location: 'Damascus', IssueDescription: 'Door sensor malfunction', SuggestedRepair: 'Replace IR sensor', Score: 80, Priority: 'Critical', Status: 'Draft', images: ['assets/images/p2.png', 'assets/images/p3.png', 'assets/images/p4.jpg', 'assets/images/p1.jpg', 'assets/images/p5.jpg'] }
          ];
        } else if (this.role === 'technician') {
          this.tasks = [
            { selected: false, Code: '#P1', ProjectName: 'Damascus Boulevard', TechnicalName: 'Atef Shalabi', UnitType: 'Elevator', Location: 'Damascus', IssueDescription: 'Door sensor malfunction', SuggestedRepair: 'Replace IR sensor', Score: 86, Priority: 'Critical', Status: 'Under Review', images: ['assets/images/p2.png', 'assets/images/p3.png', 'assets/images/p4.jpg', 'assets/images/p1.jpg', 'assets/images/p5.jpg'] },
            { selected: false, Code: '#P2', ProjectName: 'MPI factory', TechnicalName: 'Atef Shalabi', UnitType: 'Elevator', Location: 'Damascus', IssueDescription: 'Door sensor malfunction', SuggestedRepair: 'Replace IR sensor', Score: 76, Priority: 'Medium', Status: 'Approved', images: ['assets/images/p2.png', 'assets/images/p3.png', 'assets/images/p4.jpg', 'assets/images/p1.jpg', 'assets/images/p5.jpg'] }
          ];
        }
      }
    });
  }

  approve(task: MaintenanceReport | null) {
    if (!task || !task.Code) return;
    const id = task.Code.replace('#', '');
    this.resource.update('SuggestedRepairs', id + '/approve', {}).subscribe(() => {
      task.Status = 'Approved';
      this.selectedTask = task; // update UI
    });

  }

  reject(task: MaintenanceReport | null) {
    if (!task || !task.Code) return;
    const id = task.Code.replace('#', '');
    this.resource.update('SuggestedRepairs', id + '/reject', {}).subscribe(() => {
      task.Status = 'Rejected';
      this.selectedTask = task; // update UI
    });
  }

  // sample tasks data (enriched with SLA fields etc)
  router: any;
  // constructor: init map url



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
  get filteredTasks(): MaintenanceReport[] {
    let result = this.tasks;

    if (this.activeFilters.length) {
      result = result.filter(task =>
        this.activeFilters.every(f => {
          const v = (task as any)[f.field];
          if (v == null) return false;

          // ✅ لو الفلتر تاريخ
          // if (f.field === 'Date') {
          //   const taskDate = new Date(task.Date);
          //   const from = f.dateFrom ? new Date(f.dateFrom) : null;
          //   const to = f.dateTo ? new Date(f.dateTo) : null;
          //   if (from && taskDate < from) return false;
          //   if (to && taskDate > to) return false;
          //   return true;
          // }

          // باقي الفلاتر العادية
          return String(v).toLowerCase() === String(f.value).toLowerCase();
        })
      );
    }

    // 🔹 فلترة البحث
    if (this.searchText.trim() !== '') {
      const search = this.searchText.toLowerCase();
      result = result.filter(task => task.ProjectName.toLowerCase().includes(search));
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

  //لاحظ اني حطات قيمتها في ال applayDetails
  mainImage: string = '';
  setMainImage(photoPath: string) {
    this.mainImage = photoPath;
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
  performAction(task: MaintenanceReport, action: string) {
    if (action === 'view') {
      this.openDetails(task);
    } else if (action === 'delete') {
      if (!confirm(`Delete ${task.Code}?`)) return;
      const id = String(task.Code).replace('#', '');
      this.resource.delete('SuggestedRepairs', id).subscribe({
        next: () => {
          const idx = this.tasks.indexOf(task);
          if (idx >= 0) this.tasks.splice(idx, 1);
          if (this.page > this.totalPages) this.page = this.totalPages;
        },
        error: (err) => {
          alert('Not authorized or failed to delete');
          console.error('Delete SuggestedRepair failed', err);
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
  openDetails(task: MaintenanceReport) {
    if (task.images && task.images.length > 0) {
      this.mainImage = task.images[0];
    }
    this.selectedTask = task;
    this.showDetails = true;
    window.scrollTo({ top: 0, behavior: 'smooth' });
    document.body.style.overflow = 'hidden';
    const code = String(task.Code || '').replace('#', '');
    if (code) {
      this.resource.getById('SuggestedRepairs', code).subscribe({
        next: (t: any) => {
          const mapped: MaintenanceReport = {
            selected: false,
            Code: t.id ? `#${t.id}` : task.Code,
            ProjectName: t.taskItem?.unit?.client?.name || t.projectName || task.ProjectName,
            TechnicalName: t.technicianName || t.taskItem?.assigneeUser?.fullName || task.TechnicalName,
            UnitType: t.taskItem?.unit?.model || t.unitType || task.UnitType,
            Location: t.taskItem?.unit?.client?.address || t.location || task.Location,
            IssueDescription: t.description || task.IssueDescription,
            SuggestedRepair: t.title || task.SuggestedRepair,
            Score: t.cost ?? task.Score ?? 0,
            Priority: t.taskItem?.priority || task.Priority || 'Medium',
            Status: t.status || task.Status || 'Pending',
            images: Array.isArray(t.photos) ? t.photos : (typeof t.photos === 'string' && t.photos ? t.photos.split(',') : (task.images || []))
          };
          this.selectedTask = mapped;
          if (this.selectedTask.images && this.selectedTask.images.length > 0) {
            this.mainImage = this.selectedTask.images[0];
          }
        }
      });
    }

  }

  closeDetails() {
    this.selectedTask = null;
    this.showDetails = false;
    document.body.style.overflow = 'auto'; // يرجع scroll الصفحة

  }
  openInNewTab(url: string, name?: string) {
    const w = window.open('', '_blank');
    if (!w) return;
    const isPdf = url.startsWith('data:application/pdf') || /\.pdf($|\?)/i.test(url);
    const content = isPdf
      ? `<embed src="${url}" type="application/pdf" style="width:100%;height:95vh;">`
      : `<img src="${url}" style="max-width:100%;height:auto;">`;
    const download = `<a href="${url}" download="${name || 'download'}" style="margin:10px 0;display:inline-block;">Download</a>`;
    w.document.write(`<!doctype html><html><head><title>Preview</title></head><body>${content}<div>${download}</div></body></html>`);
    w.document.close();
  }
  getSortedStatuses(current: any) {
    // الحالة الحالية تبقى أول وحدة
    return [current, ...this.statuses.filter(s => s !== current)];
  }

  updateTaskStatus(task: any) {
    const index = this.tasks.findIndex(t => t.Code === task.Code);
    if (index !== -1) {
      this.tasks[index].Status = task.Status;
      // Persist to backend
      const payload = { status: task.Status };
      const id = task.id || task.Code; // Assuming Code is unique or we have ID
      this.resource.update('SuggestedRepairs', id, payload).subscribe({
        next: () => console.log('Repair status updated'),
        error: (err) => console.error('Failed to update repair status', err)
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
  openReportDetails(report: any) {
    this.routerNav.navigate(['/admin/suggested-repairs', report.Code]);
  }
  getStatusCount(status: string): number {
    return this.tasks.filter(t => t.Status === status).length;
  }
  // score
  getProgressColor(score: number): string {
    if (score >= 80) return 'progress-green';
    if (score >= 50) return 'progress-yellow';
    return 'progress-red';
  }

  getPriorityCount(priority: string): number {
    return this.tasks.filter(t => t.Priority === priority).length;
  }


  showCreateReportModal: boolean = false;

  openCreateReport() {
    this.showCreateReportModal = true;
    document.body.style.overflow = 'hidden'; // يمنع scroll الصفحة

  }
  // 4. دالة لإغلاق الـ Modal
  closeCreateReport() {
    this.showCreateReportModal = false;
    document.body.style.overflow = 'auto'; // يرجع scroll الصفحة
  }
  ///////////////////////////////////////////////////////////////////////

  // interface MaintenanceReport {
  //   selected:boolean;
  //   Code:string;
  //   ProjectName:string;
  //   TechnicalName:string;
  //   UnitType:string;
  //   Location  :string;
  //   IssueDescription:string;
  //   SuggestedRepair:string;
  //   Score:number;
  //   Priority: 'Critical' | 'High' | 'Medium' | string;
  //   Status:'Under Review' | 'Draft' | 'Approved' | string;
  //   images?:string[];

  // }
  ///////////////////////////////////////////////////////////////////////

  saveNewReport(newReportData: any) {
    const payload = {
      projectName: newReportData.ProjectName,
      technicianName: newReportData.TechnicalName,
      unitType: newReportData.UnitType,
      location: newReportData.Location,
      issueDescription: newReportData.IssueDescription,
      suggestedRepair: newReportData.SuggestedRepair,
      score: newReportData.Score,
      priority: newReportData.Priority,
      status: newReportData.Status,
      images: newReportData.images || []
    };
    this.resource.create('SuggestedRepairs', payload).subscribe({
      next: (created) => {
        const newReport: MaintenanceReport = {
          selected: false,
          Code: created?.code || `MR-${this.tasks.length + 1}`,
          ProjectName: created?.projectName || payload.projectName,
          TechnicalName: created?.technicianName || payload.technicianName,
          UnitType: created?.unitType || payload.unitType,
          Location: created?.location || payload.location,
          IssueDescription: created?.issueDescription || payload.issueDescription,
          SuggestedRepair: created?.suggestedRepair || payload.suggestedRepair,
          Score: created?.score ?? payload.score ?? 0,
          Priority: created?.priority || payload.priority || 'Medium',
          Status: created?.status || payload.status || 'Under Review',
          images: created?.images || payload.images || []
        };
        this.tasks.unshift(newReport);
        this.closeCreateReport();
        document.body.style.overflow = 'auto';
      },
      error: () => {
        const newReport: MaintenanceReport = {
          selected: false,
          Code: `MR-${this.tasks.length + 1}`,
          ProjectName: payload.projectName,
          TechnicalName: payload.technicianName,
          UnitType: payload.unitType,
          Location: payload.location,
          IssueDescription: payload.issueDescription,
          SuggestedRepair: payload.suggestedRepair,
          Score: payload.score ?? 0,
          Priority: payload.priority || 'Medium',
          Status: payload.status || 'Under Review',
          images: payload.images || []
        };
        this.tasks.unshift(newReport);
        this.closeCreateReport();
        document.body.style.overflow = 'auto';
      }
    });
  }
}
