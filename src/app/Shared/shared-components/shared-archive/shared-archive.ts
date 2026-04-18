import { SharedPageHeader } from './../../shared-layout/shared-page-header/shared-page-header';
import { Component, Input, OnInit, inject } from '@angular/core';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { CreateNewReport } from '../../../admin/pages/create-new-report/create-new-report';
import { FormsModule } from '@angular/forms';
import { CommonModule, NgFor, NgIf } from '@angular/common';
import { ResourceService } from '../../../core/resource.service';
import { Loading } from '../loading/loading';
import { ToastService } from '../../services/toast.service';

interface MaintenanceReport {
  id?: number;
  selected: boolean;
  reportId: string;
  date: string;
  maintenanceVisits: string[];
  workPerformed: string;
  technician: string;
  comments: string;
  systemId: string;
  photos: string[];
  Status?: string;
}

@Component({
  selector: 'app-shared-archive',
  standalone: true,
  imports: [FormsModule, NgIf, NgFor, CommonModule, CreateNewReport, SharedPageHeader, Loading],
  templateUrl: './shared-archive.html',
  styleUrl: './shared-archive.css'
})
export class SharedArchive implements OnInit {
  showCreateReportModal: boolean = false;
  activeTab: 'list' | 'map' = 'list';
  mapUrl: SafeResourceUrl | undefined;
  allSelected = false;
  @Input() role: 'admin' | 'dispatcher' | 'manager' | 'client' | 'finance' | null = null;
  loading = false;
  private toast = inject(ToastService);

  constructor(
    private route: ActivatedRoute,
    private resource: ResourceService,
    private sanitizer: DomSanitizer
  ) {}

  ngOnInit() {
    this.route.queryParams.subscribe(params => {
      const tab = params['tab'];
      this.activeTab = tab === 'map' ? 'map' : 'list';
    });
    this.loadTask();
  }

  reports: MaintenanceReport[] = [];
  showDetails = false;
  selectedReport: MaintenanceReport | null = null;
  searchText: string = '';
  showFilterBuilder = false;
  newFilter = { field: '', value: '' };
  activeFilters: { field: string; value: string }[] = [];
  page = 1;
  pageSize = 10;

  loadTask() {
    const params: Record<string, string> = {};
    if (this.role) params['role'] = this.role;
    this.loading = true;
    this.resource.getAll('Reports', params).subscribe({
      next: (items) => {
        this.reports = (items || [])
        .filter((r: any) => String(r.status).toLowerCase() === 'approved')
        .map((r: any, i: number) => ({
          id: r.id,
          selected: false,
          reportId: r.reportId || `MR-${r.id}`,
          date: r.date ? new Date(r.date).toLocaleDateString() : '',
          maintenanceVisits: Array.isArray(r.maintenanceVisits) ? r.maintenanceVisits : (typeof r.maintenanceVisits === 'string' && r.maintenanceVisits ? JSON.parse(r.maintenanceVisits) : []),
          workPerformed: r.workPerformed || '',
          technician: r.technicianName || '',
          comments: r.comments || '',
          systemId: (r.unit?.model && r.unit?.serial) ? `${r.unit.model} (${r.unit.serial})` : (r.unitId ? String(r.unitId) : ''),
          photos: Array.isArray(r.photos) ? r.photos : (typeof r.photos === 'string' && r.photos ? r.photos.split(',') : []),
          Status: r.status
        }));
        this.loading = false;
      },
      error: () => {
        this.loading = false;
      }
    });
  }

  getFilterValues(field: string): string[] {
    if (!field) return [];
    const values = this.reports
      .map(r => (r as any)[field])
      .filter(v => v !== undefined && v !== null && v !== '')
      .map(v => String(v));
    return Array.from(new Set(values));
  }

  toggleFilterBuilder() { this.showFilterBuilder = !this.showFilterBuilder; }

  applyFilter() {
    if (!this.newFilter.field || !this.newFilter.value) return;
    this.activeFilters.push({ ...this.newFilter });
    this.newFilter = { field: '', value: '' };
    this.showFilterBuilder = false;
    this.page = 1;
  }

  removeFilter(idx: number) {
    this.activeFilters.splice(idx, 1);
  }

  clearAllFilters() {
    this.activeFilters = [];
    this.page = 1;
  }

  get filteredReports(): MaintenanceReport[] {
    let result = this.reports;
    if (this.activeFilters.length) {
      result = result.filter(r =>
        this.activeFilters.every(f => {
          const v = (r as any)[f.field];
          return String(v).toLowerCase() === String(f.value).toLowerCase();
        })
      );
    }
    if (this.searchText.trim() !== '') {
      const s = this.searchText.toLowerCase();
      result = result.filter(r => 
        r.reportId.toLowerCase().includes(s) || 
        r.technician.toLowerCase().includes(s) ||
        r.systemId.toLowerCase().includes(s)
      );
    }
    return result;
  }

  get pagedReports(): MaintenanceReport[] {
    const start = (this.page - 1) * this.pageSize;
    return this.filteredReports.slice(start, start + this.pageSize);
  }

  get totalPages(): number {
    return Math.ceil(this.filteredReports.length / this.pageSize);
  }

  get visiblePages(): number[] {
    const total = this.totalPages;
    if (total <= 5) return Array.from({length: total}, (_, i) => i + 1);
    let start = Math.max(this.page - 2, 1);
    let end = Math.min(start + 4, total);
    if (end === total) start = Math.max(end - 4, 1);
    return Array.from({length: end - start + 1}, (_, i) => start + i);
  }

  setPage(p: number) {
    if (p >= 1 && p <= this.totalPages) this.page = p;
  }

  onSelectChange(report: MaintenanceReport, event: any) {
    const action = event.target.value;
    if (!action) return;

    if (action === 'delete') {
      if (confirm('Are you sure you want to delete this report?')) {
        if (report.id) {
          this.loading = true;
          this.resource.delete('Reports', report.id).subscribe({
            next: () => {
              this.toast.show('Report deleted successfully', 'success');
              this.loadTask();
              this.loading = false;
            },
            error: () => {
              this.toast.show('Failed to delete report', 'error');
              this.loading = false;
            }
          });
        }
      }
    } else if (action === 'approve') {
      if (report.id) {
        this.loading = true;
        this.resource.update('Reports', report.id + '/approve', {}).subscribe({
          next: () => {
            report.Status = 'Approved';
            this.toast.show('Report Approved', 'success');
            this.loading = false;
          },
          error: () => {
            this.toast.show('Failed to approve report', 'error');
            this.loading = false;
          }
        });
      }
    } else if (action === 'reject') {
      if (report.id) {
        this.loading = true;
        this.resource.update('Reports', report.id + '/reject', {}).subscribe({
          next: () => {
            report.Status = 'Rejected';
            this.toast.show('Report Rejected', 'success');
            this.loading = false;
          },
          error: () => {
            this.toast.show('Failed to reject report', 'error');
            this.loading = false;
          }
        });
      }
    }
    event.target.value = '';
  }

  // 3. تحديث البيانات الثابتة (tasks) إلى بيانات التقارير (reports)

  // 3. دالة لفتح الـ Modal عند الضغط على زر Create Report
  openCreateReport() {
    this.showCreateReportModal = true;
    document.body.style.overflow = 'hidden'; // يمنع scroll الصفحة

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
  // 4. دالة لإغلاق الـ Modal
  closeCreateReport() {
    this.showCreateReportModal = false;
    document.body.style.overflow = 'auto'; // يرجع scroll الصفحة
  }
  // 5. دالة لحفظ الـ Report الجديد وإضافته للجدول
  // 5. دالة لحفظ الـ Report الجديد وإضافته للجدول
  saveNewReport(newReportData: any) {
    // إعداد البيانات للإرسال للـ Backend
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
        const newReport: MaintenanceReport = {
          selected: false,
          reportId: created.reportId,
          date: created.date ? new Date(created.date).toLocaleDateString() : '',
          maintenanceVisits: Array.isArray(created.maintenanceVisits) ? created.maintenanceVisits : (created.maintenanceVisits ? JSON.parse(created.maintenanceVisits) : []),
          technician: created.technicianName || '',
          systemId: created.unit?.name || created.unitId || '',
          comments: created.comments || '',
          workPerformed: created.workPerformed || '',
          photos: Array.isArray(created.photos) ? created.photos : (created.photos ? String(created.photos).split(',') : [])
        };
        this.reports.unshift(newReport);
        this.closeCreateReport();
        document.body.style.overflow = 'auto';
      },
      error: (err) => {
        console.error('Failed to create report', err);
        // Fallback: Add locally if backend fails (optional, but good for demo)
        const newReport: MaintenanceReport = {
          selected: false,
          reportId: `MR-${Date.now()}`,
          date: newReportData.date || 'Jun 24, 2022',
          maintenanceVisits: newReportData.maintenanceVisits ? [newReportData.maintenanceVisits] : [],
          technician: newReportData.assignedTechnician || newReportData.technician || 'Unknown',
          systemId: newReportData.systemId || 'HVAC-00X',
          comments: newReportData.comments || '',
          workPerformed: newReportData.workPerformed || '',
          photos: (Array.isArray(newReportData.photos) && newReportData.photos.length > 0) ? newReportData.photos : ['assets/images/humanIcon.jpg']
        };
        this.reports.unshift(newReport);
        this.closeCreateReport();
        document.body.style.overflow = 'auto';
      }
    });
  }
  // 4. تحديث وظائف التحديد والصفحات للتعامل مع `reports` بدلًا من `tasks`
  // *************** وظائف التحديد (Selection Functions) ***************
  toggleAll() {

    // استخدم pagedReports مؤقتا لنتأكد أنها تعمل على العناصر المرئية
    // طبق الحالة الجديدة (this.allSelected) على كل التقارير في القائمة الأصلية
    this.reports.forEach(report => report.selected = this.allSelected);

    // (اختبار Debugging)
    console.log('ToggleAll Executed. allSelected is:', this.allSelected);
  }

  // 2. updateAllSelected(): لتحديث حالة الزر الرئيسي بناءً على حالة كل العناصر
  updateAllSelected() {
    // التحقق من كل عناصر الـ Array الأصلي
    this.allSelected = this.reports.length > 0 && this.reports.every(report => report.selected);
  }

  // *************** Pagination ***************
  page = 1;
  pageSize = 10;

  get pagedReports(): MaintenanceReport[] { // تغيير الاسم لـ pagedReports
    const start = (this.page - 1) * this.pageSize;
    return this.reports.slice(start, start + this.pageSize);
  }

  get totalPages() {
    // تم تغيير tasks.length إلى reports.length
    return Math.ceil(this.reports.length / this.pageSize);
  }
  // ... (باقي كود visiblePages و setPage كما هو) ...
  get visiblePages(): number[] { // هذا الـ Getter صحيح
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

  setPage(p: number) { // هذه الدالة صحيحة
    if (p >= 1 && p <= this.totalPages) this.page = p;
  }
  openReportDetails(report: MaintenanceReport) {
    this.selectedReport = report;
    this.showDetails = true;
    document.body.style.overflow = 'hidden';
    if (report?.id) {
      this.resource.getById('Reports', report.id).subscribe({
        next: (r: any) => {
          const mapped: MaintenanceReport = {
            id: r.id,
            selected: false,
            reportId: r.reportId || `MR-${r.id}`,
            date: r.date ? new Date(r.date).toLocaleDateString() : report.date,
            maintenanceVisits: Array.isArray(r.maintenanceVisits) ? r.maintenanceVisits : (typeof r.maintenanceVisits === 'string' && r.maintenanceVisits ? JSON.parse(r.maintenanceVisits) : (report.maintenanceVisits || [])),
            workPerformed: r.workPerformed || report.workPerformed,
            technician: r.technicianName || report.technician,
            comments: r.comments || report.comments,
            systemId: r.unit?.name || r.unitId || report.systemId,
            photos: Array.isArray(r.photos) ? r.photos : (typeof r.photos === 'string' && r.photos ? r.photos.split(',') : (report.photos || [])),
            Status: r.status || report.Status
          };
          this.selectedReport = mapped;
        }
      });
    }
  }
  closeDetails() {
    this.selectedReport = null;
    this.showDetails = false;
    document.body.style.overflow = 'auto';
  }

  constructor(
    private sanitizer: DomSanitizer,
    private route: ActivatedRoute,
    private router: Router, // إضافة Router في constructor
    private resource: ResourceService
  ) {
    this.mapUrl = this.sanitizer.bypassSecurityTrustResourceUrl(
      'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3453.640243161358!2d31.23572561502444!3d30.04441958087961!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x145840d04b868351%3A0xf05e3263004b5c75!2z2KzYqtin2YbYjCDYp9mE2YXYuSDYp9mE2YXYt9in2YUg2YPYs9mC2Ycg2YTZhdmG2KfYtNip!5e0!3m2!1sar!2seg!4v1677864000000!5m2!1sar!2seg'
    );
  }


}
