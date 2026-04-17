import { Component, EventEmitter, Input, Output, OnChanges, SimpleChanges, inject } from '@angular/core';
import { NgIf, NgFor, NgClass } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TaskService } from '../../../core/task.service';
import { AuthService } from '../../../core/auth';
import { ResourceService } from '../../../core/resource.service';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-shared-task-details',
  standalone: true,
  imports: [NgIf, NgFor, FormsModule,NgClass],
  templateUrl: './shared-task-details.html',
  styleUrl: './shared-task-details.css'
})
export class SharedTaskDetails implements OnChanges {
  @Input() visible: boolean = false;
  @Input() task: any = null;
  @Input() statuses: string[] = [];
  @Input() taskId: number | null = null;
  @Input() role: 'admin'|'manager'|'dispatcher'|'technician'|'client'|'finance'|null = null;
  @Input() focusEdit: 'assignees'|'priority'|'objective'|null = null;
  @Output() close = new EventEmitter<void>();
  @Output() changeStatus = new EventEmitter<string>();
  @Output() updated = new EventEmitter<any>();
  @Output() notify = new EventEmitter<string>();
  private taskService: TaskService = inject(TaskService);
  private auth: AuthService = inject(AuthService);
  private resource: ResourceService = inject(ResourceService);
  private http: HttpClient = inject(HttpClient);
  dueInput: string = '';
  slaDueInput: string = '';
  savingTiming = false;
  private lastLoadedId: number | null = null;
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

  onClose() { this.close.emit(); }
  onStatusChange() {
    const s = this.task?.status || 'Scheduled';
    this.changeStatus.emit(s);
  }
  canConfirm(): boolean {
    const r = this.review;
    return !!(r.date && r.objective && r.address && r.assignee && r.team && r.units && r.checklist && r.priority);
  }
  confirmAndSchedule() {
    if (!this.canConfirm()) return;
    this.task.status = 'Scheduled';
    this.onStatusChange();
  }
  ngOnChanges(changes: SimpleChanges): void {
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
        this.task = {
          id: t.id,
          name: t.title,
          status: t.status || 'Scheduled',
          slaStatus: (t as any)?.slaStatus || 'Pending',
          priority: (t as any)?.priority || 'Normal',
          team: (t as any)?.team || 'Ops',
          units: (t as any)?.unit ? `${(t as any).unit.model} (${(t as any).unit.serial})` : '',
          address: (t as any)?.locationName || '',
          start: dueStr,
          end: endOutStr,
          slaDue: slaOutStr,
          objective: (t as any)?.description || '',
          assignee: (t as any)?.assigneeUser?.fullName || (t as any)?.assigneeUser?.email || (t as any)?.assigneeUserId || '',
          assigneeId: (t as any)?.assigneeUserId || ''
        };
        this.dueInput = dueStr;
        this.slaDueInput = endOutStr;
        this.objectiveDraft = this.task.objective || '';
        this.addressDraft = this.task.address || '';
        this.teamDraft = this.task.team || '';
        this.priorityDraft = this.task.priority || 'Normal';
        this.selectedAssigneeId = String((t as any)?.assigneeUserId || '');
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
  // saveTiming() {
  //   if (!this.taskId) return;
  //   this.savingTiming = true;
  //   const parseLocal = (s: string) => {
  //     if (!s) return null;
  //     const normalized = s.replace(' ', 'T');
  //     const hasSeconds = /T\d{2}:\d{2}:\d{2}$/.test(normalized);
  //     return hasSeconds ? normalized : `${normalized}:00`;
  //   };
  //   const startIso = parseLocal(this.dueInput);
  //   const endIso = parseLocal(this.slaDueInput) || startIso;
  //   if (!startIso) { this.savingTiming = false; return; }
  //   this.taskService.updateSchedule(this.taskId, startIso, endIso!).subscribe({
  //     next: () => { this.savingTiming = false; },
  //     error: () => { this.savingTiming = false; }
  //   });
  // }
  openStartPicker(e: Event) {
    const el = e.target as HTMLInputElement;
    if ((el as any).showPicker) { (el as any).showPicker(); }
  }
  openEndPicker(e: Event) {
    const el = e.target as HTMLInputElement;
    if ((el as any).showPicker) { (el as any).showPicker(); }
  }

  savePriority() {
    if (!this.task?.id) return;
    this.savingGeneral = true;
    const v = this.priorityDraft;
    this.resource.update('Tasks', String(this.task.id), { priority: v }).subscribe({
      next: () => { 
        this.savingGeneral = false; 
        this.task.priority = v; 
        this.editing.priority = false; 
        this.updated.emit({ id: this.task.id, priority: v });
        this.notify.emit('Priority updated');
      },
      error: () => { this.savingGeneral = false; }
    });
  }
  saveObjective() {
    if (!this.task?.id) return;
    this.savingGeneral = true;
    this.resource.update('Tasks', String(this.task.id), { description: this.objectiveDraft }).subscribe({
      next: () => { 
        this.savingGeneral = false; 
        this.task.objective = this.objectiveDraft; 
        this.editing.objective = false; 
        this.updated.emit({ id: this.task.id, objective: this.objectiveDraft });
        this.notify.emit('Objective updated');
      },
      error: () => { this.savingGeneral = false; }
    });
  }
  saveAddress() {
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
        this.notify.emit('Address updated');
      },
      error: () => { this.savingGeneral = false; }
    });
  }
  fetchAddressSuggestions(query: string) {
    this.addressQuery = query;
    if (!query || query.length < 3) { this.addressSuggestions = []; this.showAddressDropdown = false; return; }
    const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}`;
    this.http.get<any[]>(url).subscribe({
      next: (res) => {
        this.addressSuggestions = res || [];
        this.showAddressDropdown = this.addressSuggestions.length > 0;
      },
      error: () => {
        this.addressSuggestions = [];
        this.showAddressDropdown = false;
      }
    });
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
    if (!this.task?.id) return;
    this.savingGeneral = true;
    this.resource.update('Tasks', String(this.task.id), { team: this.teamDraft }).subscribe({
      next: () => { 
        this.savingGeneral = false; 
        this.task.team = this.teamDraft; 
        this.editing.team = false; 
        this.updated.emit({ id: this.task.id, team: this.teamDraft });
        this.notify.emit('Team updated');
      },
      error: () => { this.savingGeneral = false; }
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
  // get filteredTechniciansForTeam() {
  //   return this.technicians.filter(t => !this.selectedTeamIds.includes(t.id) && t.id !== this.selectedAssigneeId);
  // }
  // addTeamMember() {
  //   if (!this.selectedTeamPickId) return;
  //   if (!this.selectedTeamIds.includes(this.selectedTeamPickId)) {
  //     this.selectedTeamIds.push(this.selectedTeamPickId);
  //   }
  //   this.selectedTeamPickId = '';
  // }
  // removeTeamMember(i: number) {
  //   this.selectedTeamIds.splice(i, 1);
  // }
  saveAssignee() {
    if (!this.task?.id || !this.selectedAssigneeId) return;
    const prevStatus = String(this.task.status || 'Scheduled');
    this.taskService.assign(this.task.id, this.selectedAssigneeId).subscribe({
      next: () => {
        this.task.assignee = this.getTechnicianName(this.selectedAssigneeId);
        (this.task as any).assigneeId = this.selectedAssigneeId;
        this.taskService.updateStatus(this.task.id, prevStatus).subscribe({
          next: () => { 
            this.task.status = prevStatus; 
            this.updated.emit({ id: this.task.id, assignee: this.task.assignee, assigneeId: this.selectedAssigneeId });
            this.notify.emit('Assignee updated'); 
          },
          error: () => { 
            this.updated.emit({ id: this.task.id, assignee: this.task.assignee, assigneeId: this.selectedAssigneeId });
            this.notify.emit('Assignee updated'); 
          }
        });
        this.editing.assignees = false;
      },
      error: () => {}
    });
  }
  // saveTeamMembers() {
  //   if (!this.task?.id) return;
  //   const extras = this.selectedTeamIds;
  //   this.resource.update('Tasks', String(this.task.id) + '/extras', extras).subscribe({
  //     next: () => { 
  //       const block = 'EXTRA;' + extras.join(';') + ';';
  //       let notes = String((this.task as any)?.notes || '');
  //       const start = notes.indexOf('EXTRA;');
  //       if (start >= 0) {
  //         const end = notes.indexOf('|', start);
  //         notes = end >= 0 ? notes.substring(0, start) + (notes.substring(end + 1)) : notes.substring(0, start);
  //       }
  //       notes = (notes ? (notes.endsWith('|') ? notes : notes + '|') : '') + block;
  //       (this.task as any).notes = notes;
  //       this.updated.emit({ id: this.task.id, notes: notes });
  //       this.notify.emit('Additional technicians updated');
  //       this.editing.team = false;
  //     },
  //     error: () => {}
  //   });
  // }
  // get teamNames(): string {
  //   return this.selectedTeamIds.map(id => this.getTechnicianName(id)).join(', ');
  // }
  saveAssignees() {
    if (!this.task?.id) return;
    // Persist first technician as primary assignee only (Team stays independent)
    const [primary, ...rest] = this.selectedTechnicianIds;
    if (primary) {
      const prevStatus = String(this.task.status || 'Scheduled');
      this.taskService.assign(this.task.id, primary).subscribe({
        next: () => {
          this.task.assignee = this.getTechnicianName(primary);
          (this.task as any).assigneeId = primary;
          const afterStatus = () => {
            // Save extras (additional technicians) into notes
            this.resource.update('Tasks', String(this.task.id) + '/extras', rest).subscribe({
              next: () => {
                const block = 'EXTRA;' + rest.join(';') + ';';
                let notes = String((this.task as any)?.notes || '');
                const start = notes.indexOf('EXTRA;');
                if (start >= 0) {
                  const end = notes.indexOf('|', start);
                  notes = end >= 0 ? notes.substring(0, start) + (notes.substring(end + 1)) : notes.substring(0, start);
                }
                notes = (notes ? (notes.endsWith('|') ? notes : notes + '|') : '') + block;
                (this.task as any).notes = notes;
                this.selectedTechnicianIds = [primary, ...rest];
                this.updated.emit({ id: this.task.id, assignee: this.task.assignee, assigneeId: primary, notes });
                this.notify.emit('Technicians updated');
                this.editing.assignees = false;
              },
              error: () => {
                this.selectedTechnicianIds = [primary, ...rest];
                this.updated.emit({ id: this.task.id, assignee: this.task.assignee, assigneeId: primary });
                this.notify.emit('Assignee updated');
                this.editing.assignees = false;
              }
            });
          };
          this.taskService.updateStatus(this.task.id, prevStatus).subscribe({ next: afterStatus, error: afterStatus });
        },
        error: () => { 
          this.updated.emit({ id: this.task.id, assignee: this.task.assignee, assigneeId: primary });
          this.notify.emit('Assignee updated'); 
        }
      });
    } else {
      // No primary selected -> unassign all and clear extras
      this.resource.update('Tasks', String(this.task.id) + '/unassign', null).subscribe({
        next: () => {
          this.resource.update('Tasks', String(this.task.id) + '/extras', []).subscribe({
            next: () => {
              (this.task as any).assigneeId = '';
              this.task.assignee = '';
              const notes = String((this.task as any)?.notes || '');
              const start = notes.indexOf('EXTRA;');
              (this.task as any).notes = start >= 0 ? notes.substring(0, start) : notes;
              this.updated.emit({ id: this.task.id, assignee: '', assigneeId: '', notes: (this.task as any).notes });
              this.notify.emit('Technicians cleared');
              this.editing.assignees = false;
            },
            error: () => { this.editing.assignees = false; }
          });
        },
        error: () => { this.editing.assignees = false; }
      });
    }
  }
  saveTiming() {
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
        this.notify.emit('Timing updated');
      },
      error: () => { this.savingTiming = false; }
    });
  }
  confirm() {
    if (!this.taskId) return;
    if (String(this.task?.status) === 'Draft') {
      this.taskService.updateStatus(this.taskId, 'Scheduled').subscribe({
        next: () => {
          if (this.task) this.task.status = 'Scheduled';
          // this.changeStatus.emit('Scheduled');
          this.notify.emit('Task scheduled');
        },
        error: () => {}
      });
    } else {
      // this.changeStatus.emit(String(this.task?.status || 'Scheduled'));
      this.notify.emit('Changes confirmed');
    }
  }
}
