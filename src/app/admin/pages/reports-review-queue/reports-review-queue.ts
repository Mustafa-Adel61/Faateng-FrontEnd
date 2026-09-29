import { CommonModule, NgIf, NgFor, NgClass } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { SharedPageHeader } from '../../../Shared/shared-layout/shared-page-header/shared-page-header';
import { CreateNewReport } from "../create-new-report/create-new-report";
import { ResourceService } from '../../../core/resource.service';
import { ToastService } from '../../../Shared/services/toast.service';
import { Loading } from '../../../Shared/shared-components/loading/loading';
import { ChecklistService } from '../../../Shared/services/checklist.service';

// وحدة جوه التقرير — بنعرض الـ Model مش الـ Serial
interface UnitChip {
  id: number;
  model: string;
  serial: string;
}

interface ReportRow {
  id?: number;
  selected: boolean;
  projectId?: number;
  ProjectName: string;
  Type: string;          // Report Type = نوع الزيارة (Installation / Maintenance / Update)
  ReportId: string;
  Units: UnitChip[];
  DateRaw: string;
  Date: string;
  Status: string;
  Tech: string;
  WorkPerformed: string;
  Comments: string;
  Photos: string[];
  Visits: string[];
  TaskId?: number;
}

@Component({
  selector: 'app-reports-review-queue',
  imports: [FormsModule, NgIf, NgFor, NgClass, CommonModule, SharedPageHeader, CreateNewReport, Loading],
  templateUrl: './reports-review-queue.html',
  styleUrl: './reports-review-queue.css'
})
export class ReportsReviewQueue {
  showCreateReportModal: boolean = false;

  // UI state
  showFilterBuilder = false;
  newFilter = { field: '', value: '', dateFrom: '', dateTo: '' };
  activeFilters: { field: string; value: string; dateFrom?: string; dateTo?: string }[] = [];
  quickProject = '';
  quickType = '';
  quickStatus = '';

  // details panel
  showDetails = false;
  selectedReport: ReportRow | null = null;
  statuses = ['Submitted', 'Returned', 'Approved', 'Rejected'];

  private toast: ToastService = inject(ToastService);
  private checklistService = inject(ChecklistService);

  // Selection
  allSelected = false;
  selectedCount = 0;

  // search text
  searchText: string = '';

  // Pagination
  page = 1;
  pageSize = 10;

  reports: ReportRow[] = [];
  loading = false;

  // ====== Checklist unit picker state — نفس شكل shared-task-details ======
  showUnitPicker = false;
  loadingSubs = false;
  pickerUnits: { id: number; name: string; serial?: string; done?: boolean; submissionId?: number }[] = [];

  constructor(private resource: ResourceService, private router: Router) {}

  ngOnInit(): void {
    this.loadReports();
  }

  private loadReports() {
    this.loading = true;
    this.resource.getAll('Reports').subscribe({
      next: (items) => {
        this.reports = (items || [])
          .filter((r: any) => String(r.status || '').toLowerCase() !== 'approved')
          .map((r: any): ReportRow => {
            const units: UnitChip[] = Array.isArray(r.units) && r.units.length
              ? r.units.map((u: any) => ({ id: Number(u.id), model: u.model || '', serial: u.serial || '' }))
              : (r.unitId ? [{ id: Number(r.unitId), model: r.unitModel || '', serial: r.unitSerial || '' }] : []);
            const visits: string[] = Array.isArray(r.maintenanceVisits) ? r.maintenanceVisits : [];
            return {
              id: r.id,
              selected: false,
              projectId: r.projectId ?? undefined,
              ProjectName: r.projectName || '—',
              Type: visits[0] || '—',
              ReportId: r.reportId || `MR-${r.id}`,
              Units: units,
              DateRaw: r.date ? new Date(r.date).toISOString() : '',
              Date: r.date ? new Date(r.date).toLocaleDateString() : '',
              Status: r.status || 'Submitted',
              Tech: r.technicianName || '—',
              WorkPerformed: r.workPerformed || '',
              Comments: r.comments || '',
              Photos: Array.isArray(r.photos) ? r.photos : [],
              Visits: visits,
              TaskId: r.taskId ?? undefined
            };
          });
        this.loading = false;
      },
      error: () => {
        this.reports = [];
        this.loading = false;
      }
    });
  }

  // ---------------- selection ----------------
  toggleAll() {
    this.pagedReports.forEach(t => (t.selected = this.allSelected));
    this.selectedCount = this.pagedReports.filter(t => t.selected).length;
  }

  updateAllSelected() {
    this.allSelected =
      this.pagedReports.length > 0 &&
      this.pagedReports.every(t => t.selected);
    this.selectedCount = this.pagedReports.filter(t => t.selected).length;
  }

  // ---------------- filtering ----------------
  get filteredReports(): ReportRow[] {
    let result = this.reports;

    if (this.activeFilters.length) {
      result = result.filter(r =>
        this.activeFilters.every(f => {
          if (f.field === 'date') {
            const d = r.DateRaw ? new Date(r.DateRaw) : null;
            if (!d) return false;
            const from = f.dateFrom ? new Date(f.dateFrom) : null;
            const to = f.dateTo ? new Date(f.dateTo) : null;
            if (from && d < from) return false;
            if (to && d > to) return false;
            return true;
          }
          if (f.field === 'units') {
            return r.Units.some(u => u.model.toLowerCase() === String(f.value).toLowerCase());
          }
          const v = (r as any)[f.field];
          if (v == null) return false;
          return String(v).toLowerCase() === String(f.value).toLowerCase();
        })
      );
    }

    if (this.searchText.trim() !== '') {
      const s = this.searchText.toLowerCase();
      result = result.filter(r =>
        r.ProjectName.toLowerCase().includes(s) ||
        r.ReportId.toLowerCase().includes(s) ||
        r.Type.toLowerCase().includes(s) ||
        r.Tech.toLowerCase().includes(s) ||
        r.Units.some(u => `${u.model} ${u.serial}`.toLowerCase().includes(s))
      );
    }

    return result;
  }

  get totalPages(): number {
    return Math.max(1, Math.ceil(this.filteredReports.length / this.pageSize));
  }

  get pagedReports(): ReportRow[] {
    const start = (this.page - 1) * this.pageSize;
    return this.filteredReports.slice(start, start + this.pageSize);
  }

  get visiblePages(): number[] {
    const pages: number[] = [];
    const maxButtons = 5;
    if (this.totalPages <= maxButtons) {
      for (let i = 1; i <= this.totalPages; i++) pages.push(i);
    } else {
      let start = this.page - Math.floor(maxButtons / 2);
      let end = this.page + Math.floor(maxButtons / 2);
      if (start < 1) { start = 1; end = maxButtons; }
      if (end > this.totalPages) { end = this.totalPages; start = this.totalPages - maxButtons + 1; }
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
    this.newFilter = { field: '', value: '', dateFrom: '', dateTo: '' };
  }

  getFilterValues(field: string): string[] {
    if (!field) return [];
    let values: string[] = [];
    if (field === 'units') {
      values = this.reports.flatMap(r => r.Units.map(u => u.model));
    } else if (field === 'ProjectName') {
      values = this.reports.map(r => r.ProjectName);
    } else if (field === 'Type') {
      values = this.reports.map(r => r.Type);
    } else if (field === 'Status') {
      values = this.reports.map(r => r.Status);
    }
    const clean = values.filter(v => v !== undefined && v !== null && v !== '' && v !== '—');
    return Array.from(new Set(clean));
  }

  applyQuickFilter(field: string, value: string) {
    this.activeFilters = this.activeFilters.filter(f => f.field !== field);
    if (value) this.activeFilters.push({ field, value });
    this.page = 1;
  }

  applyDateRange() {
    if (!this.newFilter.dateFrom && !this.newFilter.dateTo) return;
    this.activeFilters = this.activeFilters.filter(f => f.field !== 'date');
    this.activeFilters.push({
      field: 'date',
      value: `${this.newFilter.dateFrom || '...'} → ${this.newFilter.dateTo || '...'}`,
      dateFrom: this.newFilter.dateFrom,
      dateTo: this.newFilter.dateTo
    });
    this.page = 1;
  }

  getActiveLabel(f: { field: string }): string {
    switch (f.field) {
      case 'ProjectName': return 'Project';
      case 'Type': return 'Report Type';
      case 'Status': return 'Status';
      case 'units': return 'Unit';
      case 'date': return 'Date';
      default: return f.field;
    }
  }

  removeFilter(idx: number) {
    const removed = this.activeFilters[idx];
    this.activeFilters.splice(idx, 1);
    if (removed) {
      if (removed.field === 'ProjectName') this.quickProject = '';
      if (removed.field === 'Type') this.quickType = '';
      if (removed.field === 'Status') this.quickStatus = '';
    }
    if (this.page > this.totalPages) this.page = this.totalPages;
  }

  clearAllFilters() {
    this.activeFilters = [];
    this.quickProject = '';
    this.quickType = '';
    this.quickStatus = '';
    this.page = 1;
  }

  forceDatePicker(event: Event) {
    const target = event.target as HTMLInputElement;
    if (target.showPicker) target.showPicker();
  }

  // ---------------- actions ----------------
  performAction(report: ReportRow, action: string) {
    if (action === 'view') {
      this.openDetails(report);
    } else if (action === 'delete') {
      if (!confirm(`Delete ${report.ReportId}?`)) return;
      if (!report.id) return;
      this.resource.delete('Reports', report.id).subscribe({
        next: () => {
          const idx = this.reports.indexOf(report);
          if (idx >= 0) this.reports.splice(idx, 1);
          if (this.page > this.totalPages) this.page = this.totalPages;
        },
        error: (err) => {
          alert('Not authorized or failed to delete');
          console.error('Delete Report failed', err);
        }
      });
    }
  }

  onSelectChange(report: ReportRow, event: Event) {
    const selectElement = event.target as HTMLSelectElement;
    const value = selectElement.value;
    this.performAction(report, value);
    selectElement.selectedIndex = 0;
    selectElement.value = '';
  }

  // ---------------- details panel ----------------
  openDetails(report: ReportRow) {
    this.selectedReport = report;
    this.showDetails = true;
    document.body.style.overflow = 'hidden';
  }

  closeDetails() {
    this.selectedReport = null;
    this.showDetails = false;
    document.body.style.overflow = 'auto';
  }

  getSortedStatuses(current: any) {
    return [current, ...this.statuses.filter(s => s !== current)];
  }

  updateReportStatus(report: ReportRow) {
    const index = this.reports.findIndex(t => t.id === report.id);
    if (index === -1) return;
    const selected = String(report.Status);
    if (selected === 'Approved' && report.id) {
      this.resource.update('Reports', report.id + '/approve', {}).subscribe(() => {
        this.toast.show('Report Approved — moved to Archive', 'success');
        // التقرير المعتمد ينتقل للأرشيف فيختفي من قائمة المراجعة
        this.reports.splice(index, 1);
        this.closeDetails();
      });
    } else if ((selected === 'Rejected' || selected === 'Returned') && report.id) {
      this.resource.update('Reports', report.id + '/reject', {}).subscribe(() => {
        this.reports[index].Status = 'Returned';
        this.toast.show('Report Returned for correction', 'success');
      });
    }
  }

  openInNewTab(url: string) {
    const w = window.open('', '_blank');
    if (!w) return;
    const isPdf = url.startsWith('data:application/pdf') || /\.pdf($|\?)/i.test(url);
    const content = isPdf
      ? `<embed src="${url}" type="application/pdf" style="width:100%;height:95vh;">`
      : `<img src="${url}" style="max-width:100%;height:auto;">`;
    w.document.write(`<!doctype html><html><head><title>Preview</title></head><body>${content}</body></html>`);
    w.document.close();
  }

  // ---------------- checklist unit picker — نفس شكل shared-task-details ----------------
  // بنجيب كل الـ submissions بتاعة التاسك، وبنعرض الـ units مع علامة Done/Not Submitted
  // والضغط على أي unit بيفتح صفحة الـ submission بتاعته علطول — من غير ما نعرض إجابات جوه popup
  viewReportChecklist() {
    if (!this.selectedReport) return;
    if (!this.selectedReport?.TaskId) {
      this.toast.show('This report is not linked to a task, so there are no checklists.', 'error');
      return;
    }
    const units = this.selectedReport.Units || [];
    this.loadingSubs = true;
    this.checklistService.getSubmissionsForTask(this.selectedReport.TaskId).subscribe({
      next: (subs) => {
        const list = subs || [];
        this.loadingSubs = false;
        // لو التقرير فيه وحدة واحدة نفتح صفحة الـ submission بتاعتها علطول
        if (units.length === 1) {
          const sub = list.find(s => String(s.unitId) === String(units[0].id));
          if (sub?.id) { this.openSubmissionPage(sub.id); }
          else { this.toast.show('No checklist submissions for this unit yet', 'error'); }
          return;
        }
        this.pickerUnits = units.map(u => {
          const sub = list.find(s => String(s.unitId) === String(u.id));
          return { id: u.id, name: u.model, serial: u.serial, done: !!sub, submissionId: sub?.id };
        });
        this.showUnitPicker = true;
      },
      error: () => {
        this.loadingSubs = false;
        this.toast.show('Failed to load checklists', 'error');
      }
    });
  }

  onPickUnit(u: { done?: boolean; submissionId?: number }) {
    if (!u.submissionId) return;
    this.closeUnitPicker();
    this.openSubmissionPage(u.submissionId);
  }

  openSubmissionPage(submissionId: number) {
    this.router.navigate(['/dashboard/admin/submissions', submissionId]);
  }

  closeUnitPicker() {
    this.showUnitPicker = false;
    this.pickerUnits = [];
  }

  // ---------------- create report modal ----------------
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
      projectId: newReportData.projectId ? Number(newReportData.projectId) : null,
      date: newReportData.date ? new Date(newReportData.date).toISOString() : undefined,
      technicianUserId: newReportData.assignedTechnician || null,
      technicianName: newReportData.assignedTechnicianName || '',
      unitIds: Array.isArray(newReportData.unitIds) ? newReportData.unitIds.map((x: any) => Number(x)) : [],
      comments: newReportData.comments || '',
      workPerformed: '',
      status: newReportData.status || 'Submitted',
      photos: Array.isArray(newReportData.photos) ? newReportData.photos : [],
      maintenanceVisits: newReportData.visitType ? [newReportData.visitType] : []
    };
    this.savingNewReport = true;
    this.resource.create('Reports', payload).subscribe({
      next: () => {
        this.closeCreateReport();
        this.loadReports(); // نعيد التحميل عشان نجيب الرقم والوحدات من السيرفر
        this.toast.show('Report created successfully', 'success');
      },
      error: () => {
        this.toast.show('Failed to create report', 'error');
      },
      complete: () => { this.savingNewReport = false; }
    });
  }
}
