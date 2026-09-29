import { SharedPageHeader } from './../../shared-layout/shared-page-header/shared-page-header';
import { Component, Input, OnInit, inject } from '@angular/core';
import { NgClass, NgFor, NgIf } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { CreateNewVisit } from '../../../admin/pages/create-new-visit/create-new-visit';
import { MapComponent } from '../../../admin/pages/map/map';
import { SharedTaskDetails } from '../shared-task-details/shared-task-details';
import { TaskService, CreateTaskDto, TaskItem } from '../../../core/task.service';
import { CreateNewSuggestedRepair } from '../../../technician/pages/create-new-suggested-repair/create-new-suggested-repair';
import { CreateNewInvoice } from '../../../admin/pages/create-new-invoice/create-new-invoice';
import { ResourceService } from '../../../core/resource.service';
import { ToastService } from '../../services/toast.service';
import { Loading } from '../loading/loading';
import { ActivatedRoute } from '@angular/router';
import { AuthService } from '../../../core/auth';

interface TaskUnitInfo {
  id: number;
  name: string;
  type?: string;
}

interface Task {
  id?: number;
  selected: boolean;
  status?: 'Scheduled' | 'Dispatched' | 'On-Site' | 'Waiting-Parts' | 'Backlog' | 'QA-Review' | 'Closed' | string;
  name: string;
  units: string;
  unitList: TaskUnitInfo[];
  unitId?: number | null;
  address: string;
  start: string;
  end: string;
  objective: string;
  team: string;
  slaDue: string;
  slaStatus: 'OK' | 'Overdue' | 'Pending' | string;
  priority?: 'High' | 'Urgent' | 'Low' | 'Normal' | string;
  assignee?: string;
  assigneeId?: string;
  visitType?: string;
  notes?: string;
}

@Component({
  selector: 'app-shared-task-list',
  standalone: true,
  imports: [NgFor, NgIf, FormsModule, NgClass, CreateNewVisit, SharedPageHeader, MapComponent, CreateNewSuggestedRepair, SharedTaskDetails, Loading, CreateNewInvoice],
  templateUrl: './shared-task-list.html',
  styleUrl: './shared-task-list.css'
})
export class SharedTaskList implements OnInit {
  activeTab: 'list' | 'map' = 'list';
  mapUrl: SafeResourceUrl;

  // UI state
  showCreate = false;
  showCreateSuggestedRepairModal = false;
  selectedTaskForSuggestedRepair: Task | null = null;
  showFilterBuilder = false;
  newFilter = { field: '', value: '' };
  activeFilters: { field: string; value: string }[] = [];
  loadingList = false;
  loadingSave = false;
  loadingDetails = false;

  // details panel
  showDetails = false;
  selectedTask: Task | null = null;

  // Selection
  allSelected = false;
  // search text
  searchText: string = '';

  // Pagination
  page = 1;
  pageSize = 10;
  statuses = ['Draft', 'Scheduled', 'Dispatched', 'On-Site', 'Waiting for Parts', 'QA/Review', 'Closed', 'Backlog'];

  // Quick filters (pinned, always visible)
quickStatus: string = '';
quickPriority: string = '';
quickSla: string = '';
quickTechnician: string = '';   // فلتر الفنيين بدل الفريق
quickVisitType: string = '';   // جديد
quickProject: string = ''; // ⬅️ إضافة جديدة
quickAddress: string = ''; // ⬅️ إضافة جديدة

// ترتيب الجدول حسب SLA Due Date (الافتراضي: الأقرب للتنفيذ أولاً)
sortField: 'slaDue' | null = 'slaDue';
sortDir: 'asc' | 'desc' = 'asc';

  @Input() role: 'admin' | 'dispatcher' | 'manager' | 'technician' | 'finance' | 'client' | null = null;

  private toast: ToastService = inject(ToastService);
  constructor(
    private sanitizer: DomSanitizer,
    private taskService: TaskService,
    private resource: ResourceService,
    private route: ActivatedRoute,
    private auth: AuthService
  ) {
    this.mapUrl = this.sanitizer.bypassSecurityTrustResourceUrl(
      'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d53291.429!2d36.2165!3d33.5138!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x1518e75e1b2b1b2b%3A0x7d0b0b0b0b0b0b!2sDamascus!5e0!3m2!1sen!2ssy!4v1660000000000!5m2!1sen!2ssy'
    );
  }

  currentUserId: string | null = null;
  ngOnInit(): void {
    if (this.role === 'technician') {
      this.statuses = ['On-Site', 'Waiting for Parts', 'QA/Review'];
    } else if (this.role === 'dispatcher') {
      this.statuses = ['Draft', 'Scheduled', 'Dispatched', 'On-Site', 'Waiting for Parts', 'QA/Review'];
    } else {
      this.statuses = ['Draft', 'Scheduled', 'Dispatched', 'On-Site', 'Waiting for Parts', 'QA/Review', 'Closed', 'Backlog'];
    }
    this.resource.getAll('Auth/me').subscribe({
      next: (me: any) => {
        this.currentUserId = me?.id || null;
        this.loadTask();
        // Check for openTaskId in query params
        this.route.queryParams.subscribe(params => {
          if (params['openTaskId']) {
            const taskId = Number(params['openTaskId']);
            // Wait for tasks to load then open details
            const checkTasks = setInterval(() => {
              const task = this.tasks.find(t => t.id === taskId);
              if (task) {
                this.openDetails(task);
                clearInterval(checkTasks);
              }
            }, 500);
            // Stop after 5 seconds to avoid infinite loop
            setTimeout(() => clearInterval(checkTasks), 5000);
          }
        });
      },
      error: () => this.loadTask()
    });
  }
  tasks: Task[] = [];

  loadTask() {
    this.loadingList = true;
    this.taskService.getAll().subscribe({
      next: (data: TaskItem[]) => {
        this.tasks = data.map((t: any) => {
          const startIso = t.scheduledStart ? String(t.scheduledStart) : (t.scheduledEnd ? String(t.scheduledEnd) : '');
          const startDate = startIso ? new Date(startIso) : null;
          const now = new Date();
          let slaStatus: 'OK' | 'Overdue' | 'Pending' = 'Pending';
          if (startDate) {
            const startY = startDate.getFullYear(), startM = startDate.getMonth(), startD = startDate.getDate();
            const nowY = now.getFullYear(), nowM = now.getMonth(), nowD = now.getDate();
            const isSameDay = startY === nowY && startM === nowM && startD === nowD;
            if (isSameDay) slaStatus = 'OK';
            else if (startDate < now) slaStatus = 'Overdue';
            else slaStatus = 'Pending';
          }
          return {
            id: t.id,
            selected: false,
            status: t.status,
            name: (t as any).projectName || t.title,
            unitList: ((t as any).units || []).map((u: any) => ({
              id: u.id,
              name: `${u.model} (${u.serial})`,
              type: u.type
            })),
            units: (t as any).unitInfo || 'Unknown Unit',
            unitId: t.unitId ?? (t.unit?.id ?? null),
            address: (t as any).locationName || '',
            start: t.scheduledStart ? String(t.scheduledStart).toString() : '',
            end: t.scheduledEnd ? String(t.scheduledEnd).toString() : '',
            objective: t.description || '',
            team: t.team || 'Ops',
            slaDue: t.slaDue ? String(t.slaDue) : '',
            slaStatus: slaStatus,
            priority: t.priority,
            assignee: (t as any).assigneeName || t.assigneeUserId || '',
            assigneeId: t.assigneeUserId || '',
            visitType: t.status,
            notes: t.notes || ''
          };
        });
      },
      error: () => {},
      complete: () => { this.loadingList = false; }
    });
  }

  selectedCount = 0;
  // ---------------- selection ----------------
  toggleAll() {
    this.pagedTasks.forEach(t => (t.selected = this.allSelected));
    this.selectedCount = this.pagedTasks.filter(t => t.selected).length;
  }
  numberOfSelected: number = 0;

  updateAllSelected() {
    // update global checkbox according to visible (paged) items
    this.allSelected =
      this.pagedTasks.length > 0 &&
      this.pagedTasks.every(t => t.selected);
    // بظبط عدد المحددين
    this.selectedCount = this.pagedTasks.filter(t => t.selected).length;
  }

  // ---------------- pagination / filtered list getters ----------------
  get filteredTasks(): Task[] {
    let result = this.tasks;

    // 🔹 أولاً: فلترة حسب الفني إذا كان الدور فني
    if (this.role === 'technician' && this.currentUserId) {
      result = result.filter(task => {
        const taskAssigneeId = String((task as any).assigneeId || '');
        const currentUserIdStr = String(this.currentUserId || '');
        return taskAssigneeId === currentUserIdStr;
      });
    }

    // 🔹 ثانياً: فلترة حسب الفلاتر النشطة (لو موجودة)
    if (this.activeFilters.length) {
      result = result.filter(task =>
        this.activeFilters.every(f => {
          const v = (task as any)[f.field];
          if (v == null) return false;
          return String(v).toLowerCase() === String(f.value).toLowerCase();
        })
      );
    }

    // 🔹 ثالثاً: فلترة حسب البحث في الاسم (Project / Site)
    if (this.searchText.trim() !== '') {
      const search = this.searchText.toLowerCase();
      result = result.filter(task => task.name.toLowerCase().includes(search));
    }

    // 🔹 رابعاً: الترتيب حسب SLA Due Date — الأقرب للتنفيذ أولاً من غير ما الـ Overdue تطلع فوق
    if (this.sortField === 'slaDue') {
      const now = Date.now();
      const dir = this.sortDir === 'asc' ? 1 : -1;
      result = [...result].sort((a, b) => {
        const ta = a.slaDue ? new Date(a.slaDue).getTime() : NaN;
        const tb = b.slaDue ? new Date(b.slaDue).getTime() : NaN;
        // المهام من غير SlaDue تترتب في الآخر
        if (Number.isNaN(ta) && Number.isNaN(tb)) return 0;
        if (Number.isNaN(ta)) return 1;
        if (Number.isNaN(tb)) return -1;

        if (dir === 1) {
          // الترتيب الطبيعي: المستقبلية القريبة الأول — الـ Overdue تتأخر لآخر الجدول
          const aOverdue = ta < now;
          const bOverdue = tb < now;
          if (aOverdue && bOverdue) return tb - ta; // بين المتأخرات: الأحدث انتهاءً أولاً
          if (aOverdue) return 1;
          if (bOverdue) return -1;
          return ta - tb;                            // الأقرب جاي أولاً
        }
        return (ta - tb) * dir;                      // الترتيب العكسي عادي (الأبعد أولاً)
      });
    }

    return result;
  }

  toggleSlaSort() {
    if (this.sortField !== 'slaDue') {
      this.sortField = 'slaDue';
      this.sortDir = 'asc';
    } else {
      this.sortDir = this.sortDir === 'asc' ? 'desc' : 'asc';
    }
  }

  get slaSortIcon(): string {
    if (this.sortField !== 'slaDue') return '↕';
    return this.sortDir === 'asc' ? '↑' : '↓';
  }

  getStatusClass(status: string | undefined): string {
    return `status-${String(status || '').trim().replace(/\s+/g, '-')}`;
  }

  formatSlaDue(value: string): string {
    if (!value) return '—';
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return value;
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
  }

  get totalPages(): number {
    return Math.max(1, Math.ceil(this.filteredTasks.length / this.pageSize));
  }

  get scheduledCount(): number {
    return this.tasks.filter(task => this.normalizedStatus(task) === 'scheduled').length;
  }

  get completedCount(): number {
    return this.tasks.filter(task => this.isCompleted(task)).length;
  }

  get pendingCount(): number {
    return Math.max(0, this.tasks.length - this.scheduledCount - this.completedCount);
  }

  get complianceRate(): number {
    return this.tasks.length === 0 ? 100 : Math.round((this.completedCount / this.tasks.length) * 100);
  }

  private normalizedStatus(task: Task): string {
    return String(task.status || '').trim().toLowerCase();
  }

  private isCompleted(task: Task): boolean {
    return ['closed', 'completed', 'done'].includes(this.normalizedStatus(task));
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
    this.newFilter = { field: '', value: '' };
  }

  // Realistic filters for tasks
  getFilterValues(field: string): string[] {
    if (!field) return [];
    const values = this.tasks
      .map(task => {
        if (field === 'assignee') return task.assignee;
        if (field === 'priority') return task.priority || 'Normal';
        return (task as any)[field];
      })
      .filter(v => v !== undefined && v !== null && v !== '')
      .map(v => String(v));

    return Array.from(new Set(values));
  }
  applyFilter() {
    if (!this.newFilter.field || !this.newFilter.value) return;
    this.activeFilters.push({ ...this.newFilter });
    this.newFilter = { field: '', value: '' };
    this.showFilterBuilder = false;
    // reset to page 1
    this.page = 1;
  }

  // Quick filter: sets/replaces the filter for a given field directly (used by the pinned dropdowns)
  applyQuickFilter(field: string, value: string) {
    // remove any existing filter on this field first
    this.activeFilters = this.activeFilters.filter(f => f.field !== field);
    if (value) {
      this.activeFilters.push({ field, value });
    }
    this.page = 1;
  }

  removeFilter(idx: number) {
  const removed = this.activeFilters[idx];
  this.activeFilters.splice(idx, 1);
  if (removed) {
    if (removed.field === 'status') this.quickStatus = '';
    if (removed.field === 'priority') this.quickPriority = '';
    if (removed.field === 'slaStatus') this.quickSla = '';
    if (removed.field === 'assignee') this.quickTechnician = '';
    if (removed.field === 'visitType') this.quickVisitType = '';
    if (removed.field === 'name') this.quickProject = '';   // ⬅️ مسح فلتر المشروع
    if (removed.field === 'address') this.quickAddress = ''; // ⬅️ مسح فلتر العنوان
  }
  if (this.page > this.totalPages) this.page = this.totalPages;
}

clearAllFilters() {
  this.activeFilters = [];
  this.quickStatus = '';
  this.quickPriority = '';
  this.quickSla = '';
  this.quickTechnician = '';
  this.quickVisitType = '';
  this.quickProject = ''; // ⬅️ إضافة
  this.quickAddress = ''; // ⬅️ إضافة
  this.page = 1;
}

  // ---------------- actions ----------------
  performAction(task: Task, action: string) {
    if (action === 'view') {
      this.openDetails(task);
    } else if (action === 'assign') {
      this.detailsFocus = 'assignees';
      this.openDetails(task);
    } else if (action === 'delete') {
      if (!confirm(`Delete ${task.name}?`)) return;
      const id = String(task.id).replace('#', '');
      this.resource.delete('Tasks', id).subscribe({
        next: () => {
          const idx = this.tasks.indexOf(task);
          if (idx >= 0) this.tasks.splice(idx, 1);
          this.toast.show('Task deleted successfully', 'success');
        },
        error: (err) => {
          this.toast.show('Delete failed', 'error');
        }
      });
    } else if (action === 'createSuggestedRepair') {
      this.openCreateSuggestedRepair(task);
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
  openDetails(task: Task) {
    this.detailsFocus = this.detailsFocus || null;
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
  get selectedTaskId(): number | null {
    const id = this.selectedTask?.id;
    return typeof id === 'number' ? id : null;
  }
  detailsFocus: 'assignees' | 'priority' | 'objective' | null = null;
  getSortedStatuses(current: any) {
    // الحالة الحالية تبقى أول وحدة
    return [current, ...this.statuses.filter(s => s !== current)];
  }

  updateTaskStatus(task: any) {
    if (!task.id) return;
    this.taskService.updateStatus(task.id, task.status).subscribe(() => {
      const index = this.tasks.findIndex(t => t?.id === task.id);
      if (index !== -1) {
        this.tasks[index].status = task.status;
        this.toast.show('Status updated successfully', 'success');
      }
    });
  }

  onDetailsStatusChange(newStatus: string) {
    if (!this.selectedTask || !this.selectedTask.id) return;
    const id = this.selectedTask.id;
    this.selectedTask.status = newStatus;
    // Don't make API call or show toast here, wait for confirm!
  }

  onDetailsUpdated(patch: any) {
    if (!patch) return;
    const id = patch.id ?? this.selectedTask?.id;
    if (!id) return;
    const idx = this.tasks.findIndex(t => t?.id === id);
    if (idx >= 0) {
      this.tasks[idx] = { ...this.tasks[idx], ...patch };
      this.tasks = [...this.tasks];
    }
    if (this.selectedTask && this.selectedTask.id === id) {
      this.selectedTask = { ...this.selectedTask, ...patch };
    }
    if (patch.status) {
      this.toast.show(`Task status updated to ${patch.status}`, 'success');
    }
  }
  onDetailsNotify(msg: string) {
    this.toast.show(msg || 'Saved', 'success');
  }

  // ---------------- create visit modal (simple) ----------------
  openCreate() {
    this.showCreate = true;
    window.scrollTo({ top: 0, behavior: 'smooth' });
    document.body.style.overflow = 'hidden'; // يمنع scroll الصفحة
  }
  closeCreate() {
    this.showCreate = false;
    document.body.style.overflow = 'auto'; // يرجع scroll الصفحة
  }

  addTask(newVisit: any) {
    const techId = Array.isArray(newVisit.technicians) && newVisit.technicians.length ? String(newVisit.technicians[0]?.id || '') : null;
    // أكتر من unit في نفس المهمة
    const unitIds: number[] = Array.isArray(newVisit.unitIds) && newVisit.unitIds.length
      ? newVisit.unitIds.map((x: any) => Number(x)).filter((x: number) => !Number.isNaN(x) && x > 0)
      : (newVisit.units ? [Number(newVisit.units)] : []);
    const baseDto: CreateTaskDto = {
      unitId: unitIds.length ? unitIds[0] : undefined,
      unitIds: unitIds.length ? unitIds : undefined,
      title: '',
      description: newVisit.objective,
      scheduledStart: newVisit.due && newVisit.time ? `${newVisit.due}T${newVisit.time}:00` : undefined,
      scheduledEnd: newVisit.due && newVisit.time ? `${newVisit.due}T${newVisit.time}:00` : undefined,
      priority: 'Normal',
      lat: newVisit.lat ? Number(newVisit.lat) : undefined,
      lng: newVisit.lng ? Number(newVisit.lng) : undefined,
      locationName: newVisit.address || undefined,
      assigneeUserId: techId || undefined,
      team: 'Ops',
      slaDue: newVisit.due && newVisit.time ? `${newVisit.due}T${newVisit.time}:00` : undefined,
      slaStatus: 'Pending',
      notes: ''
    };

    const finishCreate = (dto: CreateTaskDto) => {
      this.taskService.create(dto).subscribe(res => {
        const finish = () => {
          this.loadTask();
          this.showCreate = false;
          this.toast.show('Task created successfully', 'success');
          document.body.style.overflow = 'auto';
        };
        if (!dto.assigneeUserId && techId && res?.id) {
          this.taskService.assign(res.id, techId).subscribe({ next: finish, error: finish });
        } else {
          finish();
        }
      }, err => {
        console.error(err);
        this.toast.show('فشل إنشاء الزيارة', 'error');
        this.showCreate = false;
        document.body.style.overflow = 'auto';
      });
    };

    const projId = Number(newVisit.project);
    if (projId && !Number.isNaN(projId)) {
      this.resource.getById('Projects', projId).subscribe({
        next: (p: any) => {
          const dto: CreateTaskDto = {
            ...baseDto,
            projectId: projId,
            title: p?.name || `Project ${projId}`,
            lat: baseDto.lat ?? (p?.siteLat ?? undefined),
            lng: baseDto.lng ?? (p?.siteLng ?? undefined),
            locationName: baseDto.locationName ?? (p?.siteAddress ?? undefined),
          };
          finishCreate(dto);
        },
        error: () => {
          const dto: CreateTaskDto = { ...baseDto, title: String(newVisit.project || 'Untitled Task') };
          finishCreate(dto);
        }
      });
    } else {
      const dto: CreateTaskDto = { ...baseDto, title: String(newVisit.project || 'Untitled Task') };
      finishCreate(dto);
    }
  }

  // ---------------- create suggested repair ----------------
  openCreateSuggestedRepair(task: Task) {
    this.selectedTaskForSuggestedRepair = task;
    this.showCreateSuggestedRepairModal = true;
    document.body.style.overflow = 'hidden';
  }

  closeCreateSuggestedRepair() {
    this.showCreateSuggestedRepairModal = false;
    this.selectedTaskForSuggestedRepair = null;
    document.body.style.overflow = 'auto';
  }

  onSuggestedRepairCreated(data: any) {
    // Transform form data to match backend entity if needed
    const payload = {
      TaskItemId: this.selectedTaskForSuggestedRepair?.id,
      clientName: data.ClientName,
      projectName: data.ProjectName,
      technicianName: data.TechnicalName,
      unitType: data.UnitType,
      location: data.Location,
      issueDescription: data.IssueDescription,
      suggestedRepair: data.SuggestedRepair,
      score: data.Score,
      priority: data.Priority,
      status: data.Status || 'Under Review',
      images: data.images || []
    };

    this.resource.create('SuggestedRepairs', payload).subscribe({
      next: (res) => {
        console.log('Suggested Repair Created', res);
        this.toast.show('تم إنشاء الإصلاح المقترح بنجاح', 'success');
        // Optionally update the task status to 'Waiting for Parts' or something
        if (this.selectedTaskForSuggestedRepair && this.selectedTaskForSuggestedRepair.id) {
          this.updateTaskStatus({ id: this.selectedTaskForSuggestedRepair.id, status: 'Waiting for Parts' });
        }
        this.closeCreateSuggestedRepair();
      },
      error: (err) => {
        console.error('Error creating suggested repair', err);
        this.toast.show('فشل إنشاء الإصلاح المقترح', 'error');
        this.closeCreateSuggestedRepair();
      }
    });
  }

  // ---------------- create invoice ----------------
  selectedTaskForInvoice: any;
  showCreateInvoiceModal = false;
  openCreateInvoice(task: Task) {
    this.selectedTaskForInvoice = task;
    this.showCreateInvoiceModal = true;
    document.body.style.overflow = 'hidden';
  }

  closeCreateInvoice() {
    this.showCreateInvoiceModal = false;
    this.selectedTaskForInvoice = null;
    document.body.style.overflow = 'auto';
  }

  onInvoiceCreated(data: any) {
    const payload = {
      clientName: data.Client,
      projectName: data.Project,
      issueDate: data.Date,
      dueDate: data.Due,
      amount: data.Amount,
      workOrderId: data.WorkOrderId,
      status: 'Pending',
      invoiceNumber: `INV-${Date.now()}` // Generate or let backend handle
    };

    this.resource.create('Invoices', payload).subscribe({
      next: (res) => {
        console.log('Invoice Created', res);
        this.toast.show('تم إنشاء الفاتورة بنجاح', 'success');
        // Update Task status to 'Invoiced' if desired, or just keep as Done
        if (this.selectedTaskForInvoice && this.selectedTaskForInvoice.id) {
          // Maybe we don't change WO status, or maybe we do.
        }
        this.closeCreateInvoice();
      },
      error: (err) => {
        console.error('Error creating invoice', err);
        this.toast.show('فشل إنشاء الفاتورة', 'error');
        this.closeCreateInvoice();
      }
    });
  }
}