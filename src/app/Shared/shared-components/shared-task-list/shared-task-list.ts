import { SharedPageHeader } from './../../shared-layout/shared-page-header/shared-page-header';
import { Component, Input, OnInit, SimpleChanges } from '@angular/core';
import { NgClass, NgFor, NgIf } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { CreateNewVisit } from '../../../admin/pages/create-new-visit/create-new-visit';
import { MapComponent } from '../../../admin/pages/map/map';
import { SharedTaskDetails } from '../shared-task-details/shared-task-details';
import { TaskService, CreateTaskDto, TaskItem } from '../../../core/task.service';
import { CreateNewSuggestedRepair } from '../../../technician/pages/create-new-suggested-repair/create-new-suggested-repair';
import { ResourceService } from '../../../core/resource.service';
import { CreateNewInvoice } from '../../../admin/pages/create-new-invoice/create-new-invoice';

interface Task {
  id?: number;
  selected: boolean;
  status?: 'Scheduled' | 'Dispatched' | 'On-Site' | 'Waiting-Parts' | 'Backlog' | 'QA-Review' | 'Closed' | 'Done' | string;
  name: string;
  units: string;
  address: string;
  due: string;         // date string
  objective: string;
  team: string;
  slaDue: string;      // SLA due date string
  slaStatus: 'OK' | 'Overdue' | 'Pending' | string;
  priority?: 'High' | 'Urgent' | 'Low' | string;
  assignee?: string;
  assigneeId?: string;
  visitType?: string;
  notes?: string;
}
@Component({
  selector: 'app-shared-task-list',
  standalone: true,
  imports: [NgFor, NgIf, FormsModule, NgClass, CreateNewVisit, SharedPageHeader, MapComponent, CreateNewSuggestedRepair, CreateNewInvoice, SharedTaskDetails],
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
    'Scheduled',
    'Dispatched',
    'On-Site',
    'Waiting-Parts',
    'Backlog',
    'QA/Review',
    'Done',
    'Closed'
  ];

  @Input() role: 'admin' | 'dispatcher' | 'manager' | 'technician' | 'finance' | null = null;

  constructor(private sanitizer: DomSanitizer, private taskService: TaskService, private resource: ResourceService) {
    this.mapUrl = this.sanitizer.bypassSecurityTrustResourceUrl(
      'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d53291.429!2d36.2165!3d33.5138!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x1518e75e1b2b1b2b%3A0x7d0b0b0b0b0b0b!2sDamascus!5e0!3m2!1sen!2ssy!4v1660000000000!5m2!1sen!2ssy'
    );
  }

  currentUserId: string | null = null;
  ngOnInit(): void {
    this.resource.getAll('Auth/me').subscribe({
      next: (me: any) => {
        this.currentUserId = me?.id || null;
        this.loadTask();
      },
      error: () => this.loadTask()
    });
  }
  tasks: Task[] = [];

  loadTask() {
    this.taskService.getAll().subscribe(data => {
      this.tasks = data.map(t => ({
        id: t.id,
        selected: false,
        status: t.status,
        name: (t as any).projectName || t.title,
        units: (t as any).unitInfo || 'Unknown Unit',
        address: (t as any).address || '',
        due: (t.slaDue || t.scheduledEnd) ? String(t.slaDue || t.scheduledEnd).toString().split('T')[0] : '',
        objective: t.description || '',
        team: t.team || 'Ops',
        slaDue: (t.slaDue || t.scheduledEnd) ? String(t.slaDue || t.scheduledEnd).toString() : '',
      slaStatus: t.slaStatus || 'Pending',
      priority: t.priority,
      assignee: (t as any).assigneeName || t.assigneeUserId || '',
      assigneeId: t.assigneeUserId || '',
      visitType: t.status,
      notes: t.notes || ''
      }));
    });
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
  get filteredTasks(): Task[] {
    console.log("SASATASk");

    let result = this.tasks;

    // 🔹 أولاً: فلترة حسب الفلاتر النشطة (لو موجودة)
    if (this.activeFilters.length) {
      result = result.filter(task =>
        this.activeFilters.every(f => {
          const v = (task as any)[f.field];
          if (v == null) return false;
          return String(v).toLowerCase() === String(f.value).toLowerCase();
        })
      );
    }

    // 🔹 ثانياً: فلترة حسب البحث في الاسم (Project / Site)
    if (this.searchText.trim() !== '') {
      const search = this.searchText.toLowerCase();
      result = result.filter(task => task.name.toLowerCase().includes(search));
    }

    if (this.role === 'technician' && this.currentUserId) {
      result = result.filter(t => String(t.assigneeId || '') === this.currentUserId);
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
    this.newFilter = { field: '', value: '' };
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
    if (!this.newFilter.field || !this.newFilter.value) return;
    this.activeFilters.push({ ...this.newFilter });
    this.newFilter = { field: '', value: '' };
    this.showFilterBuilder = false;
    // reset to page 1
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
    } else if (action === 'edit') {
      // تنفيذ edit: هنا مجرد alert مثال
      alert(`Edit: ${task.name}`);
    } else if (action === 'delete') {
      if (!confirm(`Delete ${task.name}?`)) return;
           const id = String(task.id).replace('#', '');
      this.resource.delete('Tasks', id).subscribe({
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
    } else if (action === 'createSuggestedRepair') {
      this.openCreateSuggestedRepair(task);
    } else if (action === 'createInvoice') {
      this.openCreateInvoice(task);
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
    if (!task.id) return;
    this.taskService.updateStatus(task.id, task.status).subscribe(() => {
      const index = this.tasks.findIndex(t => t?.id === task.id);
      if (index !== -1) {
        this.tasks[index].status = task.status;
      }
    });
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
    const baseDto: CreateTaskDto = {
      unitId: Number(newVisit.units),
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
          document.body.style.overflow = 'auto';
        };
        if (!dto.assigneeUserId && techId && res?.id) {
          this.taskService.assign(res.id, techId).subscribe({ next: finish, error: finish });
        } else {
          finish();
        }
      }, err => {
        console.error(err);
        alert('Error creating task: ' + err.message);
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
            title: p?.name || `Project ${projId}`,
            lat: baseDto.lat ?? (p?.siteLat ?? undefined),
            lng: baseDto.lng ?? (p?.siteLng ?? undefined),
            locationName: baseDto.locationName ?? (p?.siteAddress ?? undefined),
          };
          finishCreate(dto);
        },
        error: () => {
          const dto: CreateTaskDto = { ...baseDto, title: String(newVisit.project) };
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
        alert('Suggested Repair Created Successfully');
        // Optionally update the task status to 'Waiting-Parts' or something
        if (this.selectedTaskForSuggestedRepair && this.selectedTaskForSuggestedRepair.id) {
          this.updateTaskStatus({ id: this.selectedTaskForSuggestedRepair.id, status: 'Waiting-Parts' });
        }
        this.closeCreateSuggestedRepair();
      },
      error: (err) => {
        console.error('Error creating suggested repair', err);
        alert('Failed to create Suggested Repair');
        this.closeCreateSuggestedRepair();
      }
    });
  }
  selectedTaskForInvoice: any;
  showCreateInvoiceModal = false;
  // ---------------- create invoice ----------------
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
        alert('Invoice Created Successfully');
        // Update Task status to 'Invoiced' if desired, or just keep as Done
        if (this.selectedTaskForInvoice && this.selectedTaskForInvoice.id) {
          // Maybe we don't change WO status, or maybe we do. 
          // Flow says: Invoice linked to WorkOrder.
        }
        this.closeCreateInvoice();
      },
      error: (err) => {
        console.error('Error creating invoice', err);
        alert('Failed to create Invoice');
        this.closeCreateInvoice();
      }
    });
  }
}

