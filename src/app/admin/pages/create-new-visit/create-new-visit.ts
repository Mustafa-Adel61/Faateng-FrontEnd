import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Output, OnDestroy, OnInit, Input } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { UnitService, Unit } from '../../../core/unit.service';
import { ResourceService } from '../../../core/resource.service';
import { Loading } from '../../../Shared/shared-components/loading/loading';

@Component({
  selector: 'app-create-new-visit',
  imports: [CommonModule, FormsModule, Loading],
  templateUrl: './create-new-visit.html',
  styleUrl: './create-new-visit.css'
})
export class CreateNewVisit implements OnInit, OnDestroy {
  @Input() serviceRequest: any = null; // Input from Service Request
  @Input() saving: boolean = false; // Parent-driven: true while the POST is still in flight
  @Output() close = new EventEmitter<void>();
  @Output() save = new EventEmitter<any>();

  constructor(private unitService: UnitService, private resource: ResourceService) {}

  // Steps wizard زي شكل create-new-project
  step: number = 1;
  steps = [1, 2, 3];

  projects: { id: number; name: string }[] = [];
  availableUnits: Unit[] = [];

  // أكتر من unit ممكن تختار في نفس المهمة
  selectedUnitIds: number[] = [];

  form = {
    project: '',
    due: '',
    time: '',
    objective: '',
    priority: 'Low'
  };

  // بتتعبى أوتوماتيك من المشروع — للقراءة فقط
  address: string = '';
  lat: string | number = '';
  lng: string | number = '';

  submitted = false;

  selectedTechnicianId: string = '';
  selectedTechnicians: { id: string, name: string }[] = [];
  technicians = [] as { id: string, name: string }[];

  loading: boolean = false;
  private pendingLoads = 0;
  private markLoadingStart() { this.pendingLoads++; this.loading = true; }
  private markLoadingEnd() { this.pendingLoads = Math.max(0, this.pendingLoads - 1); if (this.pendingLoads === 0) this.loading = false; }

  ngOnInit() {
    this.markLoadingStart();
    this.resource.getAll('Projects').subscribe({
      next: (items) => {
        this.projects = (items || []).map((p: any) => ({
          id: p.id,
          name: p.name ?? p.projectName
        }));
      },
      error: () => { this.projects = []; },
      complete: () => { this.markLoadingEnd(); }
    });

    this.markLoadingStart();
    this.resource.getAll('Auth/technicians').subscribe({
      next: (items) => this.technicians = (items || []).map((t: any) => ({
        id: t.id,
        name: t.name || t.email || t.id
      })),
      error: () => { this.technicians = []; },
      complete: () => { this.markLoadingEnd(); }
    });

    // Pre-fill from Service Request if available
    if (this.serviceRequest) {
      const reqUnitId = Number(this.serviceRequest.unitId);
      if (!Number.isNaN(reqUnitId) && reqUnitId > 0) {
        this.selectedUnitIds = [reqUnitId];
      }
      this.form.objective = this.serviceRequest.description || '';
      this.form.due = this.serviceRequest.preferredTime ? this.serviceRequest.preferredTime.split('T')[0] : '';
      this.address = this.serviceRequest.location || '';
    }
  }

  ngOnDestroy(): void {}

  goBack() {
    if (this.step > 1) this.step--;
  }

  goNext() {
    this.submitted = true;

    if (this.step === 1) {
      const isNoProject = !this.form.project;
      // لو فيه مشروع مختار لازم يختار وحدة واحدة على الأقل
      if (!isNoProject && this.selectedUnitIds.length === 0) return;
      if (isNoProject && !String(this.form.objective || '').trim()) return;
    } else if (this.step === 2) {
      if (!this.form.due) return;
    }

    if (this.step < 3) {
      this.step++;
      this.submitted = false;
    } else {
      this.doSaveFinal();
    }
  }

  editVisit() {
    this.step = 1;
  }

  doClose() {
    this.close.emit();
  }

  doSaveFinal(_data?: any) {
    if (this.saving) return;
    this.save.emit(this.buildPayload());
  }

  private buildPayload() {
    return {
      ...this.form,
      units: this.selectedUnitIds.length ? this.selectedUnitIds[0] : '',
      unitIds: [...this.selectedUnitIds],
      address: this.address,
      lat: this.lat,
      lng: this.lng,
      technicians: this.selectedTechnicians.map(t => ({ ...t }))
    };
  }

  forceDatePicker(event: Event) {
    const target = event.target as HTMLInputElement;
    if (target.showPicker) {
      target.showPicker();
    }
  }

  addTechnician() {
    if (!this.selectedTechnicianId) return;
    const t = this.technicians.find(x => x.id === this.selectedTechnicianId);
    if (!t) return;
    if (!this.selectedTechnicians.some(x => x.id === t.id)) {
      this.selectedTechnicians.push({ id: t.id, name: t.name });
    }
    this.selectedTechnicianId = '';
  }

  removeTechnician(technician: { id: string, name: string }) {
    const index = this.selectedTechnicians.findIndex(c => c.id === technician.id);
    if (index > -1) {
      this.selectedTechnicians.splice(index, 1);
    }
  }

  isTechSelected(id: string): boolean {
    return this.selectedTechnicians.some(x => x.id === id);
  }

  getTechniciansLabel(): string {
    return this.selectedTechnicians.map(t => t.name || t.id).join(', ');
  }

  get selectedTechnicianDisplay(): string {
    if (!this.selectedTechnicianId) return '';
    const t = this.technicians.find(x => x.id === this.selectedTechnicianId);
    if (!t) return this.selectedTechnicianId;
    return t.name || this.selectedTechnicianId;
  }

  getSelectedUnitsLabel(): string {
    return this.availableUnits
      .filter(u => u?.id != null && this.selectedUnitIds.includes(Number(u.id)))
      .map(u => `${u.model} (${u.serial})`)
      .join(', ');
  }

  onUnitToggle(unitId: number) {
    const idx = this.selectedUnitIds.indexOf(unitId);
    if (idx > -1) {
      this.selectedUnitIds.splice(idx, 1);
    } else {
      this.selectedUnitIds.push(unitId);
    }
  }

  isUnitSelected(unit: Unit): boolean {
    return unit?.id != null && this.selectedUnitIds.includes(Number(unit.id));
  }

  toggleUnit(unit: Unit) {
    if (unit?.id == null) return;
    this.onUnitToggle(Number(unit.id));
  }

  clearVisit() {
    this.form = {
      project: '',
      due: '',
      time: '',
      objective: '',
      priority: 'Low'
    };
    this.selectedUnitIds = [];
    this.selectedTechnicians = [];
    this.address = '';
    this.lat = '';
    this.lng = '';
    this.step = 1;
  }

  // عند تغيير المشروع: نجيب وحدات المشروع + العنوان والإحداثيات بتتعمل read-only
  onProjectChange(projectId: any) {
    this.selectedUnitIds = [];
    this.address = '';
    this.lat = '';
    this.lng = '';

    const id = Number(projectId);
    if (!id || Number.isNaN(id)) {
      this.availableUnits = [];
      return;
    }

    this.markLoadingStart();
    this.unitService.getByProject(id).subscribe({
      next: (data) => { this.availableUnits = data || []; },
      error: () => { this.availableUnits = []; },
      complete: () => { this.markLoadingEnd(); }
    });

    this.markLoadingStart();
    this.resource.getById('Projects', id).subscribe({
      next: (p: any) => {
        this.address = p?.siteAddress || p?.location || '';
        this.lat = p?.siteLat ?? '';
        this.lng = p?.siteLng ?? '';
      },
      error: () => {},
      complete: () => { this.markLoadingEnd(); }
    });
  }
}
