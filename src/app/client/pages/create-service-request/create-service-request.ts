import { Component, EventEmitter, Input, Output, OnInit } from '@angular/core';
import { CommonModule, NgFor, NgIf } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ResourceService } from '../../../core/resource.service';

@Component({
  selector: 'app-create-service-request',
  standalone: true,
  imports: [CommonModule, FormsModule, NgIf, NgFor],
  templateUrl: './create-service-request.html',
  styleUrl: './create-service-request.css'
})
export class CreateServiceRequest implements OnInit {
  @Input() unit: any = null; // Passed from parent
  @Output() close = new EventEmitter<void>();
  @Output() save = new EventEmitter<any>();

  form = {
    serviceType: '',
    description: '',
    faultCode: '',
    preferredTime: '',
    images: [] as string[]
  };

  serviceTypes = ['Electrical', 'Plumbing', 'HVAC', 'Elevator', 'Other'];
  faultCodes = ['FC-001 (Power Loss)', 'FC-002 (Leak)', 'FC-003 (Noise)', 'FC-004 (Stopped)'];

  submitted = false;

  constructor(private resource: ResourceService) {}

  availableProjects: any[] = [];
  availableUnits: any[] = [];
  selectedProjectId: number | null = null;
  selectedUnitId: number | null = null;
  selectedUnit: any = null;

  ngOnInit() {
    this.loadProjects();
    this.loadUnits();
  }

  loadProjects() {
    this.resource.getAll('Projects').subscribe({
      next: (p) => { this.availableProjects = Array.isArray(p) ? p : []; },
      error: () => { this.availableProjects = []; }
    });
  }

  loadUnits() {
    const params: any = {};
    if (this.selectedProjectId) params['projectId'] = this.selectedProjectId;
    this.resource.getAll('Units', params).subscribe({
      next: (u) => { this.availableUnits = Array.isArray(u) ? u : []; },
      error: () => { this.availableUnits = []; }
    });
  }

  onProjectChange() {
    this.selectedUnitId = null;
    this.selectedUnit = null;
    this.loadUnits();
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

  removeImage(index: number) {
    this.form.images.splice(index, 1);
  }

  doSave() {
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
      ServiceType: this.form.serviceType,
      Description: this.form.description,
      FaultCode: this.form.faultCode || null,
      PreferredTime: this.form.preferredTime || null,
      Images: this.form.images
    };

    this.resource.create('ServiceRequests', payload).subscribe({
      next: (res) => {
        console.log('Service Request Created', res);
        this.save.emit(res);
        this.close.emit();
      },
      error: (err) => {
        console.error('Error creating service request', err);
        // Fallback for demo
        this.save.emit(payload);
        this.close.emit();
      }
    });
  }
}
