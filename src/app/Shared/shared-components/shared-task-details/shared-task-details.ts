import { Component, EventEmitter, Input, Output, OnChanges, OnDestroy, OnInit, SimpleChanges, inject } from '@angular/core';
import { NgIf, NgFor, NgClass } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TaskService } from '../../../core/task.service';
import { AuthService } from '../../../core/auth';
import { ResourceService } from '../../../core/resource.service';
import { ChecklistService } from '../../services/checklist.service';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { ToastService } from '../../services/toast.service';
import { Subject, catchError, debounceTime, distinctUntilChanged, map, of, switchMap, takeUntil, tap } from 'rxjs';

@Component({
  selector: 'app-shared-task-details',
  standalone: true,
  imports: [NgIf, NgFor, FormsModule, NgClass],
  templateUrl: './shared-task-details.html',
  styleUrl: './shared-task-details.css'
})
export class SharedTaskDetails implements OnInit, OnDestroy, OnChanges {
  @Input() visible: boolean = false;
  @Input() task: any = null;
  @Input() statuses: string[] = [];
  @Input() taskId: number | null = null;
  @Input() role: 'admin' | 'manager' | 'dispatcher' | 'technician' | 'client' | 'finance' | null = null;
  @Input() focusEdit: 'assignees' | 'priority' | 'objective' | null = null;
  @Output() close = new EventEmitter<void>();
  @Output() changeStatus = new EventEmitter<string>();
  @Output() updated = new EventEmitter<any>();
  @Output() notify = new EventEmitter<string>();
  private toast: ToastService = inject(ToastService);
  private taskService: TaskService = inject(TaskService); 
  private auth: AuthService = inject(AuthService);
  private resource: ResourceService = inject(ResourceService);
  private checklistService: ChecklistService = inject(ChecklistService);
  private http: HttpClient = inject(HttpClient);
  private router: Router = inject(Router);
  
  // Temporary state for pending changes
  tempTask: any = null;
  tempPriority: string = '';
  tempObjective: string = '';
  tempAddress: string = '';
  tempLat: number | null = null;
  tempLng: number | null = null;
  tempTeam: string = '';
  tempSelectedAssigneeId: string = '';
  tempDueInput: string = '';
  tempSlaDueInput: string = '';
  
  dueInput: string = '';
  slaDueInput: string = '';
  savingTiming = false;
  private lastLoadedId: number | null = null;
  private lastStatus = '';
  showStatusConfirmation = false;
  pendingStatus = '';
  pendingPreviousStatus = '';
  pendingStatusReason = '';
  checklistId: number | null = null;
  hasChecklist: boolean = false;
  review: any = { date: false, objective: false, address: false, assignee: false, team: false, units: false, checklist: false, priority: false };
  technicians: { id: string, name: string }[] = [];
  selectedTechnicianIds: string[] = [];
  selectedTechnicianId: string = '';
  selectedAssigneeId: string = '';
  objectiveDraft: string = '';
  addressDraft: string = '';
  teamDraft: string = '';
  savingGeneral = false;
  editing = { priority: false, objective: false, address: false, assignees: false, team: false, timing: false };
  priorityDraft: string = 'Normal';
  addressQuery: string = '';
  addressSuggestions: { display_name: string; lat: string; lon: string }[] = [];
  showAddressDropdown = false;
  latDraft: number | null = null;
  lngDraft: number | null = null;
  private readonly addressInput$ = new Subject<string>();
  private readonly destroy$ = new Subject<void>();
  private readonly addressCache = new Map<string, { ts: number; data: { display_name: string; lat: string; lon: string }[] }>();

  ngOnInit(): void {
    this.role = (this.role || this.auth.currentRole()) as typeof this.role;
    this.addressInput$
      .pipe(
        map(v => String(v || '').trim()),
        debounceTime(250),
        distinctUntilChanged(),
        switchMap(q => {
          if (q.length < 3) return of([]);
          const cached = this.addressCache.get(q);
          if (cached && Date.now() - cached.ts < 5 * 60 * 1000) return of(cached.data);
          const url = `https://nominatim.openstreetmap.org/search?format=json&limit=6&countrycodes=eg,lb&accept-language=ar&q=${encodeURIComponent(q)}`;
          return this.http.get<any[]>(url).pipe(
            tap((res: any[]) => this.addressCache.set(q, { ts: Date.now(), data: (res || []) as any })),
            catchError(() => of([]))
          );
        }),
        takeUntil(this.destroy$)
      )
      .subscribe((res: any) => {
        this.addressSuggestions = res || [];
        this.showAddressDropdown = String(this.addressQuery || '').trim().length >= 3;
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  get showChecklistBtn(): boolean {
    if (this.role !== 'technician' || !this.task) return false;
    // Show if status is changed from Scheduled/Draft
    const s = String(this.task.status).toLowerCase();
    return s !== 'scheduled' && s !== 'draft';
  }

  // ================== Unit Picker Popup ==================
  // لما التاسك يكون فيها أكتر من unit بنعرض popup عشان يختار هيشتغل على أنهي unit
  showUnitPicker = false;
  unitPickerMode: 'checklist' | 'view' = 'checklist';
  pickerUnits: { id: number; name: string; type?: string; done?: boolean; submissionId?: number }[] = [];

  openChecklist() {
    if (this.role === 'client') return;
    if (!this.task) return;
    const unitList = this.task.unitList || [];
    if (unitList.length > 1) {
      this.unitPickerMode = 'checklist';
      this.pickerUnits = unitList.map((u: any) => ({ ...u }));
      this.showUnitPicker = true;
      return;
    }
    this.proceedChecklist(unitList[0]);
  }

  proceedChecklist(unit?: { id: number; name: string }) {
    if (!this.task) return;
    this.showUnitPicker = false;
    const numericUnitId = unit?.id ?? this.task.unitId ?? (this.task.unit?.id ?? null);
    const queryParams: any = {
      site: this.task.name || '',
      unitId: numericUnitId != null ? String(numericUnitId) : (this.task.units || ''),
      technician: this.task.assignee || ''
    };
    if (unit?.name) queryParams.unitName = unit.name;
    else if (this.task?.unit?.name) queryParams.unitName = this.task.unit.name;
    if (this.task?.id != null) queryParams.taskId = this.task.id;

    const role = this.role || this.auth.currentRole() || 'technician';
    this.router.navigate([`/dashboard/${role}/checklist`], { queryParams });
    this.onClose();
  }

  viewChecklist() {
    if (this.role === 'client') return;
    if (!this.checklistId) return;
    const unitList = this.task?.unitList || [];
    if (unitList.length > 1 && this.task?.id != null) {
      // نجيب كل الـ submissions بتاعة التاسك عشان نظهر أنهي units خلصت
      this.checklistService.getSubmissionsForTask(this.task.id).subscribe({
        next: (subs: any[]) => {
          this.unitPickerMode = 'view';
          this.pickerUnits = unitList.map((u: any) => {
            const sub = subs.find(s => String(s.unitId) === String(u.id));
            return { ...u, done: !!sub, submissionId: sub?.id };
          });
          this.showUnitPicker = true;
        },
        error: () => {
          this.toast.show('Failed to load checklists', 'error');
        }
      });
      return;
    }
    this.proceedView(null);
  }

  proceedView(unit: { id: number; submissionId?: number } | null) {
    if (!this.checklistId) return;
    let targetId = this.checklistId;
    if (unit?.submissionId) targetId = unit.submissionId;
    const role = this.role || this.auth.currentRole() || 'technician';
    this.router.navigate([`/dashboard/${role}/checklist-details`, targetId]);
    this.onClose();
  }

  onPickUnit(unit: { id: number; name: string; submissionId?: number }) {
    if (this.unitPickerMode === 'checklist') {
      this.proceedChecklist(unit);
    } else {
      this.proceedView(unit);
    }
  }

  closeUnitPicker() {
    this.showUnitPicker = false;
    this.pickerUnits = [];
  }

  onClose() { this.close.emit(); }
  
  // onStatusChange() {
   // // Do NOT emit changeStatus or make API calls immediately!
    // // We'll handle this in confirm() method
  // }
   onStatusChange() {
    if (this.role === 'client') return;
    const s = this.task?.status || 'Scheduled';
    const previousStatus = this.lastStatus || s;
    const isManagement = this.role === 'admin' || this.role === 'manager' || this.role === 'dispatcher';
    const statusChanged = s !== previousStatus;
    const dispatchWithoutTechnician = s === 'Dispatched' && !this.task?.assigneeId && !this.task?.assignee;
    const unexpectedTransition = this.isUnexpectedTransition(previousStatus, s);
    if (statusChanged && isManagement && (dispatchWithoutTechnician || unexpectedTransition)) {
      this.pendingStatus = s;
      this.pendingPreviousStatus = previousStatus;
      this.pendingStatusReason = dispatchWithoutTechnician
        ? 'A task cannot be dispatched without an assigned technician. Assign a technician first so the system knows who is responsible for the work.'
        : `This is an unusual workflow transition from ${previousStatus} to ${s}. It may bypass scheduling, technician execution, review, or report generation.`;
      this.showStatusConfirmation = true;
      this.task.status = previousStatus;
      return;
    }
    this.saveStatus(s, previousStatus);
  }

  confirmStatusChange() {
    if (!this.task || !this.pendingStatus) return;
    const status = this.pendingStatus;
    const previousStatus = this.pendingPreviousStatus;
    this.showStatusConfirmation = false;
    this.task.status = status;
    this.saveStatus(status, previousStatus);
  }

  cancelStatusChange() {
    if (this.task) this.task.status = this.pendingPreviousStatus || this.task.status;
    this.showStatusConfirmation = false;
    this.pendingStatus = '';
    this.pendingPreviousStatus = '';
  }

  private saveStatus(s: string, previousStatus: string) {
    this.changeStatus.emit(s);
    if (this.task?.id != null) {
      // Auto-save: يتم حفظ تغيير الحالة فوراً بدون الحاجة للـ Confirm
      this.taskService.updateStatus(this.task.id, s).subscribe({
        next: () => {
          this.lastStatus = s;
          this.updated.emit({ id: this.task.id, status: s });
          this.toast.show('Status updated successfully', 'success');
        },
        error: () => {
          this.task.status = previousStatus;
          this.toast.show('Failed to update status', 'error');
        }
      });
    }
  }

  private isUnexpectedTransition(from: string, to: string): boolean {
    const normalTransitions: Record<string, string[]> = {
      Draft: ['Scheduled', 'Dispatched', 'Backlog'],
      Scheduled: ['Dispatched', 'Backlog'],
      Dispatched: ['On-Site', 'Scheduled', 'Backlog'],
      'On-Site': ['Waiting for Parts', 'QA/Review', 'Dispatched'],
      'Waiting for Parts': ['On-Site', 'QA/Review', 'Dispatched'],
      'QA/Review': ['Closed', 'On-Site', 'Waiting for Parts'],
      Backlog: ['Draft', 'Scheduled', 'Dispatched'],
      Closed: ['QA/Review']
    };
    return !(normalTransitions[from] || []).includes(to);
  }
  startEdit(field: string) {
    // Initialize temp values when starting edit
    if (field === 'priority') {
      this.tempPriority = this.priorityDraft;
    } else if (field === 'objective') {
      this.tempObjective = this.objectiveDraft;
    } else if (field === 'address') {
      this.tempAddress = this.addressDraft;
      this.tempLat = this.latDraft;
      this.tempLng = this.lngDraft;
    } else if (field === 'team') {
      this.tempTeam = this.teamDraft;
    } else if (field === 'assignees') {
      this.tempSelectedAssigneeId = this.selectedAssigneeId;
    } else if (field === 'timing') {
      this.tempDueInput = this.dueInput;
      this.tempSlaDueInput = this.slaDueInput;
    }
  }
  
  cancelEdit(field: string) {
    if (field === 'priority') {
      this.priorityDraft = this.tempPriority;
      this.editing.priority = false;
    } else if (field === 'objective') {
      this.objectiveDraft = this.tempObjective;
      this.editing.objective = false;
    } else if (field === 'address') {
      this.addressDraft = this.tempAddress;
      this.latDraft = this.tempLat;
      this.lngDraft = this.tempLng;
      this.editing.address = false;
    } else if (field === 'team') {
      this.teamDraft = this.tempTeam;
      this.editing.team = false;
    } else if (field === 'assignees') {
      this.selectedAssigneeId = this.tempSelectedAssigneeId;
      this.editing.assignees = false;
    } else if (field === 'timing') {
      this.dueInput = this.tempDueInput;
      this.slaDueInput = this.tempSlaDueInput;
      this.editing.timing = false;
    }
  }

  canConfirm(): boolean {
    const r = this.review;
    return !!(r.date && r.objective && r.address && r.assignee && r.team && r.units && r.checklist && r.priority);
  }
  
  confirmAndSchedule() {
    if (!this.canConfirm()) return;
    this.task.status = 'Scheduled';
    this.confirm();
  }
  
  ngOnChanges(changes: SimpleChanges): void {
    this.role = (this.role || this.auth.currentRole()) as typeof this.role;
    const id = this.taskId ?? null;
    if (id && this.visible && id !== this.lastLoadedId) {
      this.lastLoadedId = id;
      this.taskService.get(id).subscribe((t: any) => {
        const startStr = (t as any)?.scheduledStart || (t as any)?.scheduledEnd || '';
        const endStr = (t as any)?.scheduledEnd || (t as any)?.scheduledStart || '';
        const slaStr = (t as any)?.slaDue || '';
        const startDate = startStr ? new Date(startStr) : null;
        const endDate = endStr ? new Date(endStr) : null;
        const slaDate = slaStr ? new Date(slaStr) : null;
        const fmt = (d: Date | null) => d ? `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}T${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}` : '';
        const dueStr = fmt(startDate);
        const endOutStr = fmt(endDate);
        const slaOutStr = fmt(slaDate);

        // كل الـ units المرتبطة بالتاسك (لو التاسك من كونتراكت فيه أكتر من unit)
        const rawUnits: any[] = ((t as any)?.units || []).filter((u: any) => u && u.id != null);
        const unitList = rawUnits.map((u: any) => ({
          id: Number(u.id),
          name: `${u.model} (${u.serial})`,
          type: u.type || ''
        }));

        this.task = {
          id: t.id,
          name: t.title,
          status: t.status || 'Scheduled',
          slaStatus: (t as any)?.slaStatus || 'Pending',
          priority: (t as any)?.priority || 'Normal',
          team: (t as any)?.team || 'Ops',
          unitList,
          units: unitList.length
            ? unitList.map((u: any) => u.name).join(', ')
            : ((t as any)?.unit ? `${(t as any).unit.model} (${(t as any).unit.serial})` : ''),
          unitId: unitList[0]?.id ?? (t as any)?.unit?.id ?? (t as any)?.unitId ?? null,
          unitType: (t as any)?.unit?.type || '',
          unitVariant: (t as any)?.unit?.variant || '',
          frequency: (t as any)?.contract?.visitFrequency || 'Monthly',
          isChecklistDone: (t as any)?.notes?.includes('CHECKLIST_DONE'),
          address: (t as any)?.locationName || '',
          start: dueStr,
          end: endOutStr,
          slaDue: slaOutStr,
          objective: (t as any)?.description || '',
          assignee: (t as any)?.assigneeUser?.fullName || (t as any)?.assigneeUser?.email || (t as any)?.assigneeUserId || '',
          assigneeId: (t as any)?.assigneeUserId || ''
        };
        this.lastStatus = this.task.status || '';
        this.dueInput = dueStr;
        this.slaDueInput = endOutStr;
        this.objectiveDraft = this.task.objective || '';
        this.addressDraft = this.task.address || '';
        this.teamDraft = this.task.team || '';
        this.priorityDraft = this.task.priority || 'Normal';
        this.selectedAssigneeId = String((t as any)?.assigneeUserId || '');

        // Check for checklist
        this.checklistService.getSubmissionByTaskId(id).subscribe({
          next: (submission) => {
            if (submission) {
              this.hasChecklist = true;
              this.checklistId = submission.id!;
            } else {
              this.hasChecklist = false;
              this.checklistId = null;
            }
          },
          error: () => {
            this.hasChecklist = false;
            this.checklistId = null;
          }
        });

        // Load technicians for dropdown
        this.resource.getAll('Auth/technicians').subscribe({
          next: (list) => {
            this.technicians = (list || []).map((x: any) => ({ id: x.id, name: x.name || x.fullName || x.email || x.id }));
          },
          error: () => { this.technicians = []; }
        });
        if (this.focusEdit === 'assignees') this.editing.assignees = true;
        if (this.focusEdit === 'priority') this.editing.priority = true;
        if (this.focusEdit === 'objective') this.editing.objective = true;
      });
    }
    if (changes['focusEdit'] && this.focusEdit) {
      this.editing.assignees = this.focusEdit === 'assignees';
      this.editing.priority = this.focusEdit === 'priority';
      this.editing.objective = this.focusEdit === 'objective';
    }
  }
  
  get canEditTiming(): boolean {
    const r = this.role || this.auth.currentRole();
    return r === 'admin' || r === 'manager';
  }
  
  savePriority() {
    if (this.role === 'client') return;
    if (!this.task?.id) return;
    this.savingGeneral = true;
    const v = this.priorityDraft;
    this.resource.update('Tasks', String(this.task.id), { priority: v }).subscribe({
      next: () => { 
        this.savingGeneral = false; 
        this.task.priority = v; 
        this.editing.priority = false; 
        this.updated.emit({ id: this.task.id, priority: v });
        this.toast.show('Priority updated successfully', 'success');
      },
      error: () => { 
        this.savingGeneral = false; 
        this.toast.show('Failed to update priority', 'error');
      }
    });
  }
  
  saveObjective() {
    if (this.role === 'client') return;
    if (!this.task?.id) return;
    this.savingGeneral = true;
    this.resource.update('Tasks', String(this.task.id), { description: this.objectiveDraft }).subscribe({
      next: () => { 
        this.savingGeneral = false; 
        this.task.objective = this.objectiveDraft; 
        this.editing.objective = false; 
        this.updated.emit({ id: this.task.id, objective: this.objectiveDraft });
        this.toast.show('Objective updated successfully', 'success');
      },
      error: () => { 
        this.savingGeneral = false; 
        this.toast.show('Failed to update objective', 'error');
      }
    });
  }
  
  saveAddress() {
    if (this.role === 'client') return;
    if (!this.task?.id) return;
    this.savingGeneral = true;
    const payload: any = { locationName: this.addressDraft };
    if (this.latDraft != null) payload.lat = this.latDraft;
    if (this.lngDraft != null) payload.lng = this.lngDraft;
    this.resource.update('Tasks', String(this.task.id), payload).subscribe({
      next: () => { 
        this.savingGeneral = false; 
        this.task.address = this.addressDraft; 
        if (this.latDraft != null) (this.task as any).lat = this.latDraft;
        if (this.lngDraft != null) (this.task as any).lng = this.lngDraft;
        this.editing.address = false; 
        this.updated.emit({ id: this.task.id, address: this.addressDraft });
        this.toast.show('Address updated successfully', 'success');
      },
      error: () => { 
        this.savingGeneral = false; 
        this.toast.show('Failed to update address', 'error');
      }
    });
  }
  
  fetchAddressSuggestions(query: string) {
    this.addressQuery = query;
    const q = String(query || '').trim();
    if (!q || q.length < 3) {
      this.addressSuggestions = [];
      this.showAddressDropdown = false;
      return;
    }
    this.showAddressDropdown = true;
    this.addressInput$.next(q);
  }
  
  selectSuggestion(s: { display_name: string; lat: string; lon: string }) {
    this.addressDraft = s.display_name;
    this.latDraft = Number(s.lat);
    this.lngDraft = Number(s.lon);
    this.addressQuery = s.display_name;
    this.showAddressDropdown = false;
  }
  
  clearAddressSearch() {
    this.addressQuery = '';
    this.addressSuggestions = [];
    this.showAddressDropdown = false;
  }
  
  saveTeam() {
    if (this.role === 'client') return;
    if (!this.task?.id) return;
    this.savingGeneral = true;
    this.resource.update('Tasks', String(this.task.id), { team: this.teamDraft }).subscribe({
      next: () => { 
        this.savingGeneral = false; 
        this.task.team = this.teamDraft; 
        this.editing.team = false; 
        this.updated.emit({ id: this.task.id, team: this.teamDraft });
        this.toast.show('Team updated successfully', 'success');
      },
      error: () => { 
        this.savingGeneral = false; 
        this.toast.show('Failed to update team', 'error');
      }
    });
  }
  
  addTechnician() {
    if (!this.selectedTechnicianId) return;
    if (!this.selectedTechnicianIds.includes(this.selectedTechnicianId)) {
      this.selectedTechnicianIds.push(this.selectedTechnicianId);
    }
    this.selectedTechnicianId = '';
  }
  
  removeTechnician(i: number) {
    this.selectedTechnicianIds.splice(i, 1);
  }
  
  get filteredTechnicians(): { id: string, name: string }[] {
    return this.technicians.filter(t => !this.selectedTechnicianIds.includes(t.id));
  }
  
  getTechnicianName(id: string): string {
    return this.technicians.find(t => t.id === id)?.name || id;
  }
  
  get filteredTechniciansForAssign(): { id: string, name: string }[] {
    return this.technicians.filter(t => !this.selectedTechnicianIds.includes(t.id));
  }
  
  addAssigned() {
    if (!this.selectedTechnicianId) return;
    if (!this.selectedTechnicianIds.includes(this.selectedTechnicianId)) {
      this.selectedTechnicianIds.push(this.selectedTechnicianId);
    }
    this.selectedTechnicianId = '';
  }
  
  removeAssigned(i: number) {
    this.selectedTechnicianIds.splice(i, 1);
  }
  
  saveAssignee() {
    if (this.role === 'client') return;
    if (!this.task?.id || !this.selectedAssigneeId) return;
    // الـ assign بس — مفيش أي call لـ UpdateStatus غير لما الـ status يتغير فعلاً لـ Closed
    this.taskService.assign(this.task.id, this.selectedAssigneeId).subscribe({
      next: (data: any) => {
        this.task.assignee = this.getTechnicianName(this.selectedAssigneeId);
        this.task.status = 'Dispatched';
        if (data?.status && String(data.status) === 'Closed') {
          // الـ backend هو الوحيد اللي يغير الحالة لـ Closed
          this.task.status = data.status;
          this.changeStatus.emit(data.status);
        }
        (this.task as any).assigneeId = this.selectedAssigneeId;
        this.updated.emit({ id: this.task.id, assignee: this.task.assignee, assigneeId: this.selectedAssigneeId, status: 'Dispatched' });
        this.notify.emit('Assignee updated');
        this.editing.assignees = false;
      },
      error: () => {}
    });
  }
  
  saveTiming() {
    if (this.role === 'client') return;
    if (!this.taskId) return;
    this.savingTiming = true;
    const parseLocal = (s: string) => {
      if (!s) return null;
      const normalized = s.replace(' ', 'T');
      const hasSeconds = /T\d{2}:\d{2}:\d{2}$/.test(normalized);
      return hasSeconds ? normalized : `${normalized}:00`;
    };
    const startIso = parseLocal(this.dueInput);
    const endIso = parseLocal(this.slaDueInput) || startIso;
    if (!startIso) { this.savingTiming = false; return; }
    this.taskService.updateSchedule(this.taskId, startIso, endIso!).subscribe({
      next: () => {
        this.savingTiming = false;
        if (this.task) { this.task.start = this.dueInput; this.task.end = this.slaDueInput; }
        this.editing.timing = false;
        this.updated.emit({ id: this.taskId, start: this.dueInput, end: this.slaDueInput });
        this.toast.show('Timing updated successfully', 'success');
      },
      error: () => { 
        this.savingTiming = false; 
        this.toast.show('Failed to update timing', 'error');
      }
    });
  }
  
  confirm() {
    if (this.role === 'client') return;
    if (!this.taskId) return;
    // First make API call to update status
    this.taskService.updateStatus(this.taskId, this.task?.status || '').subscribe({
      next: () => {
              this.changeStatus.emit(this.task.status);   // ✅ أضف السطر ده
        this.toast.show('Status updated successfully', 'success');
        this.onClose();
      },
      error: () => {
        this.toast.show('Failed to update status', 'error');
      }
    });
  }

  openStartPicker(event: Event) {
    this.forceDatePicker(event);
  }

  openEndPicker(event: Event) {
    this.forceDatePicker(event);
  }

  forceDatePicker(event: Event) {
    const target = event.target as HTMLInputElement;
    if (target.showPicker) {
      target.showPicker();
    }
  }
}
