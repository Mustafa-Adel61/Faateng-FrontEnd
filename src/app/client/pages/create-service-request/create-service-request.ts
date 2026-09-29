import { Component, ElementRef, EventEmitter, Input, Output, OnInit, ViewChild } from '@angular/core';
import { CommonModule, NgFor, NgIf } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ResourceService } from '../../../core/resource.service';
import { Loading } from '../../../Shared/shared-components/loading/loading';

@Component({
  selector: 'app-create-service-request',
  standalone: true,
  imports: [CommonModule, FormsModule, NgIf, NgFor, Loading],
  templateUrl: './create-service-request.html',
  styleUrl: './create-service-request.css'
})
export class CreateServiceRequest implements OnInit {
  @Input() unit: any = null; // Passed from parent
  @Output() close = new EventEmitter<void>();
  @Output() save = new EventEmitter<any>();
  @ViewChild('fileInput') fileInput!: ElementRef<HTMLInputElement>;

  form = {
    serviceType: '',
    description: '',
    faultCode: '',
    preferredTime: '',
    priority: 'Normal',
    images: [] as string[]
  };

  serviceTypes = ['Electrical', 'Plumbing', 'HVAC', 'Elevator', 'Other'];
  faultCodes = ['FC-001 (Power Loss)', 'FC-002 (Leak)', 'FC-003 (Noise)', 'FC-004 (Stopped)'];

  submitted = false;
  loading: boolean = false;
  saving: boolean = false;

  constructor(private resource: ResourceService) {}

  availableProjects: any[] = [];
  availableUnits: any[] = [];
  selectedProjectId: number | null = null;
  selectedUnitId: number | null = null;
  selectedUnit: any = null;
  selectedProject: any = null;

  ngOnInit() {
    this.loading = true;
    this.loadProjects(() => {
      this.loadUnits(() => {
        this.loading = false;
      });
    });
  }

  loadProjects(done?: () => void) {
    this.resource.getAll('Projects').subscribe({
      next: (p) => {
        const list = Array.isArray(p) ? p : [];
        this.availableProjects = list.map((x: any) => ({
          id: x.Id ?? x.id,
          Name: x.Name ?? x.name,
          ClientName: x.ClientName ?? x.clientName
        }));
      },
      error: () => { this.availableProjects = []; },
      complete: () => { if (done) done(); }
    });
  }

  loadUnits(done?: () => void) {
    const params: any = {};
    if (this.selectedProjectId) params['projectId'] = this.selectedProjectId;
    this.resource.getAll('Units', params).subscribe({
      next: (u) => {
        const list = Array.isArray(u) ? u : [];
        this.availableUnits = list.map((x: any) => ({
          id: x.Id ?? x.id,
          Serial: x.Serial ?? x.serial,
          Model: x.Model ?? x.model,
          Type: x.Type ?? x.type,
          Price: x.Price ?? x.price,
          Quantity: x.Quantity ?? x.quantity
        }));
      },
      error: () => { this.availableUnits = []; },
      complete: () => { if (done) done(); }
    });
  }

  onProjectChange() {
    this.selectedUnitId = null;
    this.selectedUnit = null;
    this.selectedProject = this.availableProjects.find(p => String(p.id) === String(this.selectedProjectId)) || null;
    this.loading = true;
    this.loadUnits(() => { this.loading = false; });
  }

  onUnitChange() {
    this.selectedUnit = this.availableUnits.find(u => String(u.id) === String(this.selectedUnitId)) || null;
  }

  onFileSelected(event: any) {
    const files: FileList = event.target.files;
    if (!files || files.length === 0) return;
    Array.from(files).forEach(file => {
      const reader = new FileReader();
      reader.onload = (e: any) => {
        if (e.target?.result) this.form.images.push(e.target.result as string);
      };
      reader.readAsDataURL(file);
    });
  }

  openFilePicker(): void {
    const input = document.createElement('input');
    input.type = 'file';
    input.multiple = true;
    input.accept = 'image/*';
    input.onchange = (event: Event) => this.onFileSelected(event);
    input.click();
  }

  forceDatePicker(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (typeof input.showPicker === 'function') {
      input.showPicker();
    }
  }

  removeImage(index: number) {
    this.form.images.splice(index, 1);
  }

  doSave() {
    if (this.saving) return;
    this.submitted = true;
    if (!this.form.serviceType || !this.form.description) {
      return;
    }

    const chosenUnitId = this.selectedUnitId ?? (this.unit?.id || this.unit?.UnitNumber) ?? null;
    const chosenUnitName =
      (this.selectedUnit ? `${this.selectedUnit.Serial || ''} ${this.selectedUnit.Model || ''}`.trim() : '') ||
      (this.unit?.unitName || '');

    const payload = {
      UnitId: chosenUnitId,
      UnitName: chosenUnitName || null,
      ProjectId: this.selectedProjectId ?? null,
      ProjectName: this.selectedProject?.Name ?? null,
      ServiceType: this.form.serviceType,
      Description: this.form.description,
      FaultCode: this.form.faultCode || null,
      Priority: this.form.priority || 'Normal',
      PreferredTime: this.form.preferredTime || null,
      Images: this.form.images
    };

    this.saving = true;
    this.loading = true;
    this.resource.create('ServiceRequests', payload).subscribe({
      next: (res) => {
        this.save.emit(res);
        this.close.emit();
        this.loading = false;
        this.saving = false;
      },
      error: (err) => {
        this.save.emit(payload);
        this.close.emit();
        this.loading = false;
        this.saving = false;
      }
    });
  }
}
