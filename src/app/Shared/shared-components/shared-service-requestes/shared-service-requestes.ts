import { SharedPageHeader } from './../../shared-layout/shared-page-header/shared-page-header';
import { Component, Input, OnInit, SimpleChanges } from '@angular/core';
import { NgClass, NgFor, NgIf } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { CreateNewVisit } from '../../../admin/pages/create-new-visit/create-new-visit';
import { ResourceService } from '../../../core/resource.service';
import { AuthService } from '../../../core/auth';

interface Task {
  id?: number | string;
  selected: boolean;
  status?: 'New' | 'Scheduled' | 'Dispatched' | 'On-Site' | 'Waiting-Parts' | 'Backlog' | 'QA-Review' | 'Closed' | 'Done' | string;
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
  visitType?: string;
  notes?: string;
  originalData?: any; // To store the full backend object
}

@Component({
  selector: 'app-shared-service-requestes',
  imports: [NgFor, NgIf, FormsModule, NgClass, SharedPageHeader, CreateNewVisit],
  templateUrl: './shared-service-requestes.html',
  styleUrl: './shared-service-requestes.css'
})
export class SharedServiceRequestes implements OnInit {
  showFilterBuilder = false;
  newFilter = { field: '', value: '' };
  activeFilters: { field: string; value: string }[] = [];

  showCreateRequestModal = false;
  newRequest: {
    unitId?: number | null;
    unitName?: string | null;
    serviceType: string;
    description: string;
    faultCode?: string | null;
    preferredTime?: string | null;
    imagesText?: string | null;
  } = {
    unitId: null,
    unitName: null,
    serviceType: '',
    description: '',
    faultCode: null,
    preferredTime: null,
    imagesText: null
  };
  availableUnits: any[] = [];
  availableProjects: any[] = [];
  selectedProjectId: number | null = null;

  // details panel
  showDetails = false;
  selectedTask: Task | null = null;
  technicians: { id: string, name: string }[] = [];
  selectedTechnicianId: string | null = null;

  // Work Order Modal
  showCreateWorkOrderModal = false;
  selectedRequestForWorkOrder: any = null;

  // Selection
  allSelected = false;
  //  search text
  searchText: string = '';

  // Pagination
  page = 1;
  pageSize = 10;
  statuses = [
    'New',
    'Scheduled',
    'Dispatched',
    'On-Site',
    'Waiting-Parts',
    'Backlog',
    'QA/Review',
    'Done',
    'Closed'
  ];

  @Input() role: 'client' | null = null;

  constructor(private resource: ResourceService, private auth: AuthService) { }

  ngOnInit(): void {
    this.loadTask();
    this.loadUnits();
    this.loadProjects();
  }
  tasks: Task[] = [];
  loadUnits() {
    const params: any = {};
    if (this.selectedProjectId) params['projectId'] = this.selectedProjectId;
    this.resource.getAll('Units', params).subscribe({
      next: (u) => { this.availableUnits = Array.isArray(u) ? u : []; },
      error: () => { this.availableUnits = []; }
    });
  }
  loadProjects() {
    this.resource.getAll('Projects').subscribe({
      next: (p) => { this.availableProjects = Array.isArray(p) ? p : []; },
      error: () => { this.availableProjects = []; }
    });
  }
  onProjectChange() {
    this.loadUnits();
  }

  loadTask() {
    this.resource.getAll('ServiceRequests').subscribe({
      next: (data: any[]) => {
        // Map backend data to frontend Task interface
        this.tasks = data.map(item => ({
          id: item.id,
          selected: false,
          name: item.unitName || 'Unknown Unit',
          units: item.unitName || '',
          status: item.status || 'New',
          assignee: item.assignedTaskItem?.assigneeUser?.fullName || 'Unassigned',
          address: item.unit?.client?.address || 'Unknown Address',
          due: item.preferredTime || '',
          objective: item.description || '',
          team: item.assignedTaskItem?.team || 'General',
          slaDue: item.assignedTaskItem?.slaDue || '',
          slaStatus: item.assignedTaskItem?.slaStatus || 'Pending',
          priority: item.assignedTaskItem?.priority || 'Low',
          visitType: item.serviceType || 'Maintenance',
          notes: item.notes || '',
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
      }
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
        });
      }
    } else if (action === 'createWorkOrder') {
      this.openCreateWorkOrder(task);
    }

  }
  openCreateRequest() {
    this.showCreateRequestModal = true;
    document.body.style.overflow = 'hidden';
  }
  closeCreateRequest() {
    this.showCreateRequestModal = false;
    document.body.style.overflow = 'auto';
  }
  saveNewRequest() {
    const payload = {
      UnitId: this.newRequest.unitId || undefined,
      UnitName: this.newRequest.unitName || undefined,
      ServiceType: this.newRequest.serviceType || 'Other',
      Description: this.newRequest.description || '',
      FaultCode: this.newRequest.faultCode || undefined,
      PreferredTime: this.newRequest.preferredTime ? new Date(this.newRequest.preferredTime).toISOString() : undefined,
      Images: this.newRequest.imagesText ? this.newRequest.imagesText.split(',').map(s => s.trim()).filter(Boolean) : []
    };
    this.resource.create('ServiceRequests', payload).subscribe({
      next: () => {
        this.closeCreateRequest();
        this.loadTask();
        // reset
        this.newRequest = { unitId: null, unitName: null, serviceType: '', description: '', faultCode: null, preferredTime: null, imagesText: null };
      },
      error: (err) => {
        console.error('Failed to create service request', err);
        alert('Failed to create service request');
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
    console.log('Creating Work Order:', workOrderData);

    // 1. Create Task from visit form
    const techId = (workOrderData.technicians && workOrderData.technicians.length) ? workOrderData.technicians[0]?.id || null : null;
    const taskPayload = {
      unitId: Number(workOrderData.units),
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
        alert('Task Created (Mock)');
        this.closeCreateWorkOrder();
      }
    });
  }

  // ---------------- details panel ----------------
  openDetails(task: Task) {
    this.selectedTask = task;
    this.showDetails = true;
    this.loadTechnicians();
    if (task?.id) {
      this.resource.getById('ServiceRequests', String(task.id)).subscribe({
        next: (item: any) => {
          const mapped: Task = {
            id: item.id,
            selected: false,
            name: item.unitName || task.name,
            units: item.unitName || task.units,
            status: item.status || task.status || 'New',
            assignee: item.assignee || task.assignee || 'Unassigned',
            address: item.address || task.address || '',
            due: item.preferredTime || task.due || '',
            objective: item.description || task.objective || '',
            team: item.team || task.team || 'General',
            slaDue: item.slaDue || task.slaDue || '',
            slaStatus: item.slaStatus || task.slaStatus || 'Pending',
            priority: item.priority || task.priority || 'Low',
            visitType: item.serviceType || task.visitType || 'Maintenance',
            notes: item.notes || task.notes || '',
            originalData: item
          };
          this.selectedTask = mapped;
        }
      });
    }
  }

  closeDetails() {
    this.showDetails = false;
    this.selectedTask = null;
  }

  updateTaskStatus(task: Task) {
    if (!task.id) return;
    // Map frontend status to backend if needed, or just send
    this.resource.update('ServiceRequests', task.id, { status: task.status }).subscribe({
      next: () => console.log('Status updated'),
      error: (err) => console.error('Error updating status', err)
    });
  }

  getSortedStatuses(currentStatus: string | undefined): string[] {
    return this.statuses; // Simplification, can be smarter
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

  getFilterValues(field: string): string[] {
    if (!field) return [];
    const values = this.tasks
      .map(t => (t as any)[field])
      .filter(v => v !== undefined && v !== null)
      .map(v => String(v));

    return Array.from(new Set(values));
  }

  applyFilter() {
    if (this.newFilter.field && this.newFilter.value) {
      this.activeFilters.push({ ...this.newFilter });
      this.newFilter = { field: '', value: '' };
    }
  }
  removeFilter(i: number) { this.activeFilters.splice(i, 1); }
  clearAllFilters() { this.activeFilters = []; }

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
}
