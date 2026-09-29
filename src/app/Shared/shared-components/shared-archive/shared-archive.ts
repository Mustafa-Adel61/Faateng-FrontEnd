import { Component, Input, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule, NgFor, NgIf, NgClass } from '@angular/common';
import { Router } from '@angular/router';
import { SharedPageHeader } from './../../shared-layout/shared-page-header/shared-page-header';
import { ResourceService } from '../../../core/resource.service';
import { Loading } from '../loading/loading';
import { ChecklistService } from '../../services/checklist.service';
import { ToastService } from '../../services/toast.service';

// وحدة جوه التقرير — بنعرض الـ Model مش الـ Serial
interface UnitChip {
  id: number;
  model: string;
  serial: string;
}

interface ArchiveReportRow {
  id?: number;
  selected: boolean;
  projectId?: number;
  ProjectName: string;
  Type: string;          // Report Type = نوع الزيارة
  ReportId: string;
  Units: UnitChip[];
  DateRaw: string;
  Date: string;
  Status: string;
  Tech: string;
  WorkPerformed: string;
  Comments: string;
  Photos: string[];
  TaskId?: number;
}

@Component({
  selector: 'app-shared-archive',
  standalone: true,
  imports: [FormsModule, NgIf, NgFor, NgClass, CommonModule, SharedPageHeader, Loading],
  templateUrl: './shared-archive.html',
  styleUrl: './shared-archive.css'
})
export class SharedArchive implements OnInit {
  @Input() role: 'admin' | 'dispatcher' | 'manager' | 'client' | 'finance' | null = null;
  loading = false;
  private checklistService = inject(ChecklistService);
  private toast = inject(ToastService);

  constructor(private resource: ResourceService, private router: Router) {}

  ngOnInit() {
    this.loadTask();
  }

  reports: ArchiveReportRow[] = [];
  showDetails = false;
  selectedReport: ArchiveReportRow | null = null;

  // UI state — نفس شكل الـ task-list والـ review-queue
  searchText: string = '';
  showFilterBuilder = false;
  newFilter = { field: '', value: '', dateFrom: '', dateTo: '' };
  activeFilters: { field: string; value: string; dateFrom?: string; dateTo?: string }[] = [];
  quickProject = '';
  quickType = '';
  quickUnit = '';

  // ====== Checklist unit picker state — نفس شكل shared-task-details ======
  showUnitPicker = false;
  loadingSubs = false;
  pickerUnits: { id: number; name: string; serial?: string; done?: boolean; submissionId?: number }[] = [];

  loadTask() {
    this.loading = true;
    this.resource.getAll('Reports').subscribe({
      next: (items) => {
        this.reports = (items || [])
          .filter((r: any) => String(r.status || '').toLowerCase() === 'approved')
          .map((r: any): ArchiveReportRow => {
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
              Status: r.status || 'Approved',
              Tech: r.technicianName || '—',
              WorkPerformed: r.workPerformed || '',
              Comments: r.comments || '',
              Photos: Array.isArray(r.photos) ? r.photos : [],
              TaskId: r.taskId ?? undefined
            };
          });
        this.loading = false;
      },
      error: () => {
        this.loading = false;
      }
    });
  }

  // ---------------- filtering (نفس شكل الـ task-list) ----------------
  get filteredReports(): ArchiveReportRow[] {
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

  get pagedReports(): ArchiveReportRow[] {
    const start = (this.page - 1) * this.pageSize;
    return this.filteredReports.slice(start, start + this.pageSize);
  }

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
      if (removed.field === 'units') this.quickUnit = '';
    }
    if (this.page > this.totalPages) this.page = this.totalPages;
  }

  clearAllFilters() {
    this.activeFilters = [];
    this.quickProject = '';
    this.quickType = '';
    this.quickUnit = '';
    this.page = 1;
  }

  forceDatePicker(event: Event) {
    const target = event.target as HTMLInputElement;
    if (target.showPicker) target.showPicker();
  }

  // ---------------- pagination ----------------
  page = 1;
  pageSize = 10;

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

  // ---------------- details panel ----------------
  openReportDetails(report: ArchiveReportRow) {
    // بنستخدم الصف نفسه اللي جاي من الـ GetAll — فيه كل حاجة
    // (الـ Units كلها + الصور + الـ TaskId) زي الـ review queue بالظبط
    // مفيش call زيادة لـ /Reports/{id} عشان الـ details تفضل مطابقة للجدول دايماً
    this.selectedReport = report;
    this.showDetails = true;
  }

  closeDetails() {
    this.selectedReport = null;
    this.showDetails = false;
    document.body.style.overflow = 'auto';
  }

  openInNewTab(url: string) {
    const w = window.open('', '_blank');
    if (!w) return;
    const isPdf = url.startsWith('data:application/pdf') || /\.pdf($|\?)/i.test(url);
    const content = isPdf
      ? `<embed src="${url}" type="application/pdf" style="width:100%;height:95vh;">`
      : `<img src="${url}" style="max-width:100%;height:auto;">`;
    const download = `<a href="${url}" download="photo" style="margin:10px 0;display:inline-block;">Download</a>`;
    w.document.write(`<!doctype html><html><head><title>Preview</title></head><body>${content}<div>${download}</div></body></html>`);
    w.document.close();
  }

  // ---------------- checklist unit picker (زي الـ review queue والـ shared-task-details بالظبط) ----------------
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
    // صفحة تفاصيل الـ submission موجودة تحت راوتر الـ admin بس — كل الرولات بتتحول عليها
    this.router.navigate(['/dashboard/admin/submissions', submissionId]);
  }

  closeUnitPicker() {
    this.showUnitPicker = false;
    this.pickerUnits = [];
  }
}
