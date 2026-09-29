import { SharedPageHeader } from './../../shared-layout/shared-page-header/shared-page-header';
import { Loading } from '../../shared-components/loading/loading';
import { Component, Input, OnInit, SimpleChanges, inject } from '@angular/core';
import { NgClass, NgFor, NgIf } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { CreateNewVisit } from '../../../admin/pages/create-new-visit/create-new-visit';
import { ResourceService } from '../../../core/resource.service';
import { AuthService } from '../../../core/auth';
import { SidebarNotificationService } from '../../../core/sidebar-notification.service';
import { ToastService } from '../../services/toast.service';

interface Task {
  id?: number | string;
  selected: boolean;
  status?: string;
  name: string;
  units: string;
  address: string;
  due: string;         // date string
  objective: string;
  team: string;
  slaDue: string;      // SLA due date string
  slaStatus: 'OK' | 'Overdue' | 'Pending' | string;
  priority?: 'Urgent' | 'High' | 'Normal' | 'Low' | string;
  assignee?: string;
  visitType?: string;
  notes?: string;
  faultCode?: string;
  dateCreated?: string;
  images?: string[];
  originalData?: any; // To store the full backend object
}

@Component({
  selector: 'app-shared-service-requestes',
  imports: [NgFor, NgIf, FormsModule, NgClass, SharedPageHeader, CreateNewVisit, Loading],
  templateUrl: './shared-service-requestes.html',
  styleUrl: './shared-service-requestes.css'
})
export class SharedServiceRequestes implements OnInit {
  showFilterBuilder = false;
  activeFilters: { field: string; value: string }[] = [];

  // 🔹 Quick Filters Models: كل فلتر في الـ grid بيشتغل أوتوماتيك من غير Apply
  quickStatus = '';
  quickPriority = '';
  quickServiceType = '';
  quickUnit = '';
  quickAssignee = '';
  quickTeam = '';
  quickSlaStatus = '';
  quickFaultCode = '';
  quickAddress = '';
  quickObjective = '';
  quickPreferredTime = '';
  quickDateCreated = '';

  // الحقول النصية: بتتعمل ليها contains بدل equals
  readonly textFilterFields = ['address', 'objective', 'due', 'dateCreated'];

  showCreateRequestModal = false;
  newRequest: {
    unitId?: number | null;
    unitName?: string | null;
    serviceType: string;
    description: string;
    faultCode?: string | null;
    preferredTime?: string | null;
    imagesText?: string | null;
    priority: string;
  } = {
    unitId: null,
    unitName: null,
    serviceType: '',
    description: '',
    faultCode: null,
    preferredTime: null,
    imagesText: null,
    priority: 'Normal'
  };
  availableUnits: any[] = [];
  availableProjects: any[] = [];
  selectedProjectId: number | null = null;

  // details panel
  showDetails = false;
  selectedTask: Task | null = null;
  previewPhotoUrl: string | null = null;
  technicians: { id: string, name: string }[] = [];
  selectedTechnicianId: string | null = null;
  selectedTechnicianIds: string[] = [];
  loadingAssign = false;
  statusUpdating: string | null = null;
  loadingList = false;
  loadingDetails = false;
  loadingCreate = false;
  loadingUnits = false;
  loadingProjects = false;

  // Work Order Modal
  showCreateWorkOrderModal = false;
  selectedRequestForWorkOrder: any = null;
  savingWorkOrder = false;

  // Selection
  allSelected = false;
  //  search text
  searchText: string = '';

  // Pagination
  page = 1;
  pageSize = 10;
  statuses = [
    'New',
    'In Progress',
    'Assigned',
    'Completed',
  ];

  @Input() role: 'client' | null = null;

  private toastService: ToastService = inject(ToastService);
  constructor(private resource: ResourceService, private auth: AuthService, private notifications: SidebarNotificationService) { }

  ngOnInit(): void {
    this.loadTask();
    this.loadUnits();
    this.loadProjects();
  }
  tasks: Task[] = [];
  loadUnits() {
    this.loadingUnits = true;
    const params: any = {};
    if (this.selectedProjectId) params['projectId'] = this.selectedProjectId;
    this.resource.getAll('Units', params).subscribe({
      next: (u) => { this.availableUnits = Array.isArray(u) ? u : []; },
      error: () => { this.availableUnits = []; },
      complete: () => { this.loadingUnits = false; }
    });
  }
  loadProjects() {
    this.loadingProjects = true;
    this.resource.getAll('Projects').subscribe({
      next: (p) => { this.availableProjects = Array.isArray(p) ? p : []; },
      error: () => { this.availableProjects = []; },
      complete: () => { this.loadingProjects = false; }
    });
  }
  onProjectChange() {
    this.loadUnits();
  }

  loadTask() {
    this.loadingList = true;
    this.resource.getAll('ServiceRequests').subscribe({
      next: (data: any[]) => {
        // Map backend data to frontend Task interface
        
        this.tasks = data.map(item => ({
          id: item.id,
          selected: false,
          name: item.serviceType || 'Unknown serviceType',
          units: item.unitName || '',
          status: this.statusLabel(item.status),
          assignee: (item.assignees && Array.isArray(item.assignees) && item.assignees.length) ? item.assignees.join(', ') : (item.assignedTaskItem?.assigneeUser?.fullName || 'Unassigned'),
          address: item.address || 'Unknown Address',
          due: item.preferredTime || '',
          objective: item.description || '',
          team: item.assignedTaskItem?.team || 'General',
          slaDue: item.assignedTaskItem?.slaDue || '',
          slaStatus: item.assignedTaskItem?.slaStatus || 'Pending',
          priority: item.priority || item.assignedTaskItem?.priority || 'Normal',
          visitType: item.serviceType || 'Maintenance',
          notes: item.notes || '',
          faultCode: item.faultCode || '',
          dateCreated: item.createdDate ? new Date(item.createdDate).toLocaleDateString() : '',
          images: Array.isArray(item.images) ? item.images : [],
          originalData: item
        }));

        // Filter for client if role is client (assuming backend returns all for now, ideally backend filters)
        // In a real app, the token would determine this. Here we simulate.
        if (this.role === 'client') {
          // Filter by client's units if we had that info. 
          // For now, let's assume all requests are visible or filter by some client ID if available.
          // Since we don't have auth context, we leave it as is, or filter if we had a client ID.
        }
      },
      error: (err) => {
        console.error('Error fetching service requests', err);
        // Fallback to mock data if backend fails (optional, but good for dev)
        this.useMockData();
      },
      complete: () => { this.loadingList = false; }
    });
  }

  get canCreateTask(): boolean {
    const role = this.auth.currentRole();
    return role === 'admin' || role === 'dispatcher' || role === 'manager';
  }

  useMockData() {
    this.tasks = [
      {
        selected: false,
        name: 'Carlton Hotel – Damascus',
        units: 'E-12, E-13',
        status: 'On-Site',
        assignee: 'O. Zahra',
        address: 'Shukri Al-Quwati St',
        due: '2025-10-20',
        objective: 'Quarterly PM – Elevators',
        team: 'Damascus Ops',
        slaDue: '2025-10-21 10:00',
        slaStatus: 'OK',
        priority: 'High',
        visitType: 'Scheduled',
        notes: 'Open 8d'
      },
      // ... existing mock data ...
    ];
  }



  // ---------------- actions ----------------
  onSelectChange(task: Task, event: any) {
    const action = event.target.value;
    event.target.value = ''; // reset dropdown
    if (action === 'view') {
      this.openDetails(task);
    } else if (action === 'delete') {
      // Implement delete logic
      if (confirm('Are you sure you want to delete this request?') && task.id) {
        this.resource.delete('ServiceRequests', task.id).subscribe(() => {
          this.loadTask();
          this.toastService.show('Request deleted successfully', 'success');
        });
      }
    } else if (action === 'createWorkOrder') {
      this.openCreateWorkOrder(task);
    }

  }
  openCreateRequest() {
    this.showCreateRequestModal = true;
    document.body.style.overflow = 'hidden';
    this.loadingCreate = false;
  }
  closeCreateRequest() {
    this.showCreateRequestModal = false;
    document.body.style.overflow = 'auto';
  }
  saveNewRequest() {
    this.loadingCreate = true;
    const payload = {
      UnitId: this.newRequest.unitId || undefined,
      UnitName: this.newRequest.unitName || undefined,
      ServiceType: this.newRequest.serviceType || 'Other',
      Description: this.newRequest.description || '',
      FaultCode: this.newRequest.faultCode || undefined,
      PreferredTime: this.newRequest.preferredTime ? new Date(this.newRequest.preferredTime).toISOString() : undefined,
      Images: this.newRequest.imagesText ? this.newRequest.imagesText.split(',').map(s => s.trim()).filter(Boolean) : [],
      Priority: this.newRequest.priority || 'Normal'
    };
    this.resource.create('ServiceRequests', payload).subscribe({
      next: (created: any) => {
        const newTask: Task = {
          id: created?.id,
          selected: false,
          name: created?.serviceType || 'Unknown Unit',
          units: created?.unitName || '',
          status: this.statusLabel(created?.status),
          assignee: created?.assigneeUser?.fullName || 'Unassigned',
          address: created?.address || '',
          due: created?.preferredTime || '',
          objective: created?.description || '',
          team: created?.team || 'General',
          slaDue: created?.slaDue || '',
          slaStatus: created?.slaStatus || 'Pending',
          priority: created?.priority || 'Normal',
          visitType: created?.serviceType || 'Maintenance',
          notes: '',
          faultCode: created?.faultCode || '',
          dateCreated: created?.createdDate ? new Date(created.createdDate).toLocaleDateString() : '',
          images: Array.isArray(created?.images) ? created.images : [],
          originalData: created
        };
        this.tasks.unshift(newTask);
        this.toastService.show('تم إنشاء الطلب بنجاح', 'success');
        this.closeCreateRequest();
        // reset
        this.newRequest = { unitId: null, unitName: null, serviceType: '', description: '', faultCode: null, preferredTime: null, imagesText: null, priority: 'Normal' };
        this.loadingCreate = false;
      },
      error: (err) => {
        console.error('Failed to create service request', err);
        this.toastService.show('فشل إنشاء الطلب', 'error');
        this.loadingCreate = false;
      }
    });
  }

  openCreateWorkOrder(task: Task) {
    this.selectedRequestForWorkOrder = task.originalData || task;
    this.showCreateWorkOrderModal = true;
  }

  closeCreateWorkOrder() {
    this.showCreateWorkOrderModal = false;
    this.selectedRequestForWorkOrder = null;
  }

  onWorkOrderCreated(workOrderData: any) {
    if (this.savingWorkOrder) return;
    this.savingWorkOrder = true;
    console.log('Creating Work Order:', workOrderData);

    // 1. Create Task from visit form
    const techId = (workOrderData.technicians && workOrderData.technicians.length) ? workOrderData.technicians[0]?.id || null : null;
    const taskPayload = {
      unitId: Number(workOrderData.units),
      unitIds: Array.isArray(workOrderData.unitIds) && workOrderData.unitIds.length
        ? workOrderData.unitIds.map((x: any) => Number(x))
        : (workOrderData.units ? [Number(workOrderData.units)] : undefined),
      title: workOrderData.project,
      description: workOrderData.objective,
      scheduledStart: workOrderData.due && workOrderData.time ? `${workOrderData.due}T${workOrderData.time}:00` : undefined,
      scheduledEnd: workOrderData.due && workOrderData.time ? `${workOrderData.due}T${workOrderData.time}:00` : undefined,
      priority: workOrderData.priority || 'Normal',
      lat: workOrderData.lat ? Number(workOrderData.lat) : undefined,
      lng: workOrderData.lng ? Number(workOrderData.lng) : undefined,
      assigneeUserId: techId || undefined
    };

    this.resource.create('Tasks', taskPayload).subscribe({
      next: (task) => {
        const afterAssign = () => {
          if (this.selectedRequestForWorkOrder && this.selectedRequestForWorkOrder.id) {
            this.resource.update('ServiceRequests', this.selectedRequestForWorkOrder.id, { status: 'In Progress' }).subscribe(() => {
              this.loadTask();
            });
          } else {
            this.loadTask();
          }
          this.closeCreateWorkOrder();
        };
        afterAssign();
      },
      error: (err) => {
        console.error('Error creating Task', err);
        this.toastService.show('تم إنشاء المهمة (نموذج)', 'info');
        this.closeCreateWorkOrder();
      },
      complete: () => { this.savingWorkOrder = false; }
    });
  }

  // ---------------- details panel ----------------
  openDetails(task: Task) {
    this.selectedTask = task;
    this.showDetails = true;
    this.loadingDetails = true;
    document.body.style.overflow = 'hidden';
    if (this.role !== 'client') {
      this.loadTechnicians();
    }
    if (task?.id) {
      this.resource.getById('ServiceRequests', String(task.id)).subscribe({
next: (item: any) => {
            const mapped: Task = {
              id: item.id,
              selected: false,
              name: item.serviceType || task.name,
              units: item.unitName || task.units,
              status: this.statusLabel(item.status || task.status),
              assignee: (item.assignees && Array.isArray(item.assignees) && item.assignees.length) ? item.assignees.join(', ') : (item.assigneeUser?.fullName || task.assignee || 'Unassigned'),
              address: item.address || task.address || '',
              due: item.preferredTime ? new Date(item.preferredTime).toLocaleString() : (task.due || ''),
              objective: item.description || task.objective || '',
              team: item.team || task.team || 'General',
              slaDue: item.slaDue || task.slaDue || '',
              slaStatus: item.slaStatus || task.slaStatus || 'Pending',
              priority: item.priority || task.priority || 'Normal',
              visitType: item.serviceType || task.visitType || 'Maintenance',
              notes: item.notes || task.notes || '',
              faultCode: item.faultCode || task.faultCode || '',
              dateCreated: item.createdDate ? new Date(item.createdDate).toLocaleDateString() : (task.dateCreated || ''),
              images: Array.isArray(item.images) ? item.images : [],
              originalData: item
            };
          this.selectedTask = mapped;
          if (Array.isArray(item.assignedIds) && item.assignedIds.length) {
            this.selectedTechnicianIds = [...item.assignedIds];
          } else {
            this.selectedTechnicianIds = [];
          }
        },
        complete: () => { this.loadingDetails = false; }
      });
    } else {
      this.loadingDetails = false;
    }
  }

  closeDetails() {
    this.showDetails = false;
    this.selectedTask = null;
    document.body.style.overflow = 'auto';
  }

  showPhoto(url: string) {
    this.previewPhotoUrl = url;
  }

  closePreview() {
    this.previewPhotoUrl = null;
  }

  isPdfUrl(url: string): boolean {
    return url.startsWith('data:application/pdf') || /\.pdf($|\?)/i.test(url);
  }

  updateTaskStatus(task: Task, targetStatus?: string) {
    if (this.role === 'client') return;
    if (!task.id) return;
    // منع تكرار الطلب لو الـ user دوس على الزر أكتر من مرة
    if (this.statusUpdating) return;
    const backendStatus = this.statusLabel(targetStatus || task.status || 'New');
    this.statusUpdating = backendStatus;
    this.resource.update('ServiceRequests', task.id, { status: backendStatus }).subscribe({
      next: () => {
        this.toastService.show('تم تغيير الحالة بنجاح', 'success');
        if (this.selectedTask && this.selectedTask.id === task.id) {
          this.selectedTask.status = backendStatus;
        }
        const idx = this.tasks.findIndex(t => t.id === task.id);
        if (idx >= 0) this.tasks[idx].status = backendStatus;
        this.notifications.refreshNow();
      },
      error: (err) => {
        console.error('Error updating status', err);
        this.toastService.show('فشل تغيير الحالة', 'error');
      },
      complete: () => { this.statusUpdating = null; }
    });
  }

  getSortedStatuses(currentStatus: string | undefined): string[] {
    return this.statuses; // Simplification, can be smarter
  }

  // Normalizes legacy backend status values into the new lifecycle
  statusLabel(raw: string | undefined): string {
    const s = (raw || '').trim();
    if (s === 'InProgress') return 'In Progress';
    if (s === 'Closed') return 'Completed';
    return s || 'New';
  }

  getStatusCount(status: string): number {
    return this.tasks.filter(t => this.statusLabel(t.status) === status).length;
  }

  approve(task: Task) {
    if (this.role === 'client' || !task.id) return;
    this.updateTaskStatus(task, 'In Progress');
  }

  complete(task: Task) {
    if (this.role === 'client' || !task.id) return;
    this.updateTaskStatus(task, 'Completed');
  }

  refresh() {
    this.loadTask();
  }

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
  get filteredTasks(): Task[] {
    let result = this.tasks;

    // 🔹 أولاً: فلترة حسب الفلاتر النشطة (لو موجودة)
    if (this.activeFilters.length) {
      result = result.filter(task =>
        this.activeFilters.every(f => {
          const v = (task as any)[f.field];
          if (v == null) return false;

          if (this.textFilterFields.includes(f.field)) {
            return String(v).toLowerCase().includes(String(f.value).toLowerCase());
          }
          return String(v).toLowerCase() === String(f.value).toLowerCase();
        })
      );
    }

    // 🔹 ثانياً: فلترة حسب البحث في الاسم (Project / Site)
    if (this.searchText.trim() !== '') {
      const search = this.searchText.toLowerCase();
      result = result.filter(task => task.name.toLowerCase().includes(search));
    }

    // Role based filtering (if not handled by backend)
    if (this.role === 'client') {
      // In a real app, backend filters. 
      // Here we might filter by checking if unitName belongs to client? 
      // Without auth context, we assume all are visible or backend handles it.
    }

    return result;
  }

  get pagedTasks(): Task[] {
    const startIndex = (this.page - 1) * this.pageSize;
    return this.filteredTasks.slice(startIndex, startIndex + this.pageSize);
  }

  get visiblePages(): number[] {
    const total = this.totalPages;
    if (total <= 5) {
      return Array.from({ length: total }, (_, i) => i + 1);
    }
    // Simplification for brevity
    return [1, 2, 3, 4, 5].filter(p => p <= total);
  }
  setPage(p: number) {
    if (p >= 1 && p <= this.totalPages) {
      this.page = p;
    }
  }

  // Filter Builder methods (keep existing or implement)
  toggleFilterBuilder() { this.showFilterBuilder = !this.showFilterBuilder; }

  // Realistic filters for service requests
  getFilterValues(field: string): string[] {
    if (!field) return [];
    const values = this.tasks
      .map(t => (t as any)[field])
      .filter(v => v !== undefined && v !== null && v !== '')
      .map(v => String(v));
    return Array.from(new Set(values)).sort((a, b) => a.localeCompare(b));
  }

  // 🔹 تطبيق الفلاتر السريعة تلقائياً (زي suggested-repairs بالظبط)
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

  removeFilter(i: number) {
    const removedFilter = this.activeFilters[i];
    this.activeFilters.splice(i, 1);

    // إعادة تعيين قيمة المتغير في الشبكة
    if (removedFilter) {
      const fieldMap: { [key: string]: string } = {
        status: 'quickStatus',
        priority: 'quickPriority',
        name: 'quickServiceType',
        units: 'quickUnit',
        assignee: 'quickAssignee',
        team: 'quickTeam',
        slaStatus: 'quickSlaStatus',
        faultCode: 'quickFaultCode',
        address: 'quickAddress',
        objective: 'quickObjective',
        due: 'quickPreferredTime',
        dateCreated: 'quickDateCreated'
      };
      const prop = fieldMap[removedFilter.field];
      if (prop) (this as any)[prop] = '';
    }

    if (this.page > this.totalPages) this.page = this.totalPages;
  }

  clearAllFilters() {
    this.activeFilters = [];
    this.quickStatus = '';
    this.quickPriority = '';
    this.quickServiceType = '';
    this.quickUnit = '';
    this.quickAssignee = '';
    this.quickTeam = '';
    this.quickSlaStatus = '';
    this.quickFaultCode = '';
    this.quickAddress = '';
    this.quickObjective = '';
    this.quickPreferredTime = '';
    this.quickDateCreated = '';
    this.page = 1;
  }

  get totalPages(): number {
    return Math.max(1, Math.ceil(this.filteredTasks.length / this.pageSize));
  }

  loadTechnicians() {
    this.resource.getAll('Auth/technicians').subscribe({
      next: (list) => { this.technicians = list || []; },
      error: () => { this.technicians = []; }
    });
  }

  assignTechnician() {
    if (!this.selectedTask?.id || !this.selectedTechnicianId) return;
    this.resource.update('ServiceRequests', String(this.selectedTask.id) + '/assign', this.selectedTechnicianId).subscribe({
      next: () => {
        this.selectedTask!.status = 'Assigned';
        this.closeDetails();
        this.loadTask();
      },
      error: (err) => console.error('Failed to assign technician', err)
    });
  }

  addTechnician() {
    if (!this.selectedTechnicianId) return;
    if (!this.selectedTechnicianIds.includes(this.selectedTechnicianId)) {
      this.selectedTechnicianIds.push(this.selectedTechnicianId);
    }
    this.selectedTechnicianId = null;
  }
  removeTechnician(i: number) {
    this.selectedTechnicianIds.splice(i, 1);
  }
  getTechnicianName(id: string): string {
    return this.technicians.find(t => t.id === id)?.name || id;
  }
  get filteredTechnicians(): { id: string, name: string }[] {
    return this.technicians.filter(t => !this.selectedTechnicianIds.includes(t.id));
  }
  assignTechnicians() {
    if (!this.selectedTask?.id || this.selectedTechnicianIds.length === 0) return;
    this.loadingAssign = true;
    this.resource.update('ServiceRequests', String(this.selectedTask.id) + '/assign', this.selectedTechnicianIds).subscribe({
      next: () => {
        this.loadingAssign = false;
        this.selectedTask!.status = 'Assigned';
        this.toastService.show('تم تعيين الفنيين بنجاح', 'success');
        this.closeDetails();
        this.selectedTechnicianIds = [];
        this.selectedTechnicianId = null;
        this.loadTask();
      },
      error: (err) => {
        this.loadingAssign = false;
        console.error('Failed to assign technicians', err);
        this.toastService.show('فشل تعيين الفنيين', 'error');
      }
    });
  }
}
