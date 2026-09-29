import { Component, EventEmitter, Output, Input, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { UnitService } from '../../../core/unit.service';
import { Loading } from '../../../Shared/shared-components/loading/loading';
import { ResourceService } from '../../../core/resource.service';
import { ToastService } from '../../../Shared/services/toast.service';
import { ChecklistService, Checklist } from '../../../Shared/services/checklist.service';
import { ChecklistEditor } from '../checklist-editor/checklist-editor';

@Component({
  selector: 'app-create-new-unit',
  standalone: true,
  imports: [FormsModule, CommonModule, HttpClientModule, Loading, ChecklistEditor],
  templateUrl: './create-new-unit.html',
  styleUrl: './create-new-unit.css'
})
export class CreateNewUnit implements OnInit {
  @Input() projectId: number | null = null;
  @Input() clientId: string | null = null;
  @Input() projectName: string | null = null;
  @Input() clientName: string | null = null;
  
  @Output() close = new EventEmitter<void>();
  @Output() save = new EventEmitter<any>();
  @Output() notify = new EventEmitter<string>();

  step = 1;
  showRules = false;
  showManualTests = false;
  loading = false;
  saving = false;
  submitted = false;

  unitTypes = [
    { name: 'Elevator', desc: 'Vertical transportation for people and goods.', icon: '🛗' },
    { name: 'Escalator', desc: 'Moving staircase for large crowds.', icon: '🪜' },
    { name: 'Moving Walk', desc: 'Horizontal conveyor for long distances.', icon: '🚶' },
    { name: 'AHU', desc: 'Air Handling Unit for central HVAC systems.', icon: '🌬️' },
    { name: 'FCU', desc: 'Fan Coil Unit for local climate control.', icon: '🌀' },
    { name: 'VRF / DX', desc: 'Variable Refrigerant Flow system.', icon: '🌡️' },
    { name: 'Chiller', desc: 'Industrial cooling for large buildings.', icon: '❄️' },
    { name: 'Cooling Tower', desc: 'Heat rejection for HVAC systems.', icon: '🏗️' },
    { name: 'Pump', desc: 'Water or fluid circulation systems.', icon: '💧' },
    { name: 'Exhaust/Supply Fan', desc: 'Ventilation and air extraction.', icon: '💨' },
    { name: 'Package / Rooftop Unit', desc: 'Self-contained rooftop AC.', icon: '📦' }
  ];

  form: any = {
    Type: '',
    AutoId: '',
    SuggestedName: '',
    Serial: '',
    Model: '',
    Price: 0,
    Quantity: 1,
    InstallationDate: '',
    IsModernized: false,
    ModernizationDate: '',
    Status: 'Active',
    // Elevator
    Brand: '',
    CapacityKg: null,
    NumberOfStops: null,
    MachineRoomType: '',
    MachineType: '',
    ControllerType: '',
    ControllerName: '',
    ServingFloors: '',
    // Escalator
    Rise: null,
    Width: null,
    Speed: null,
    Direction: '',
    ServingLevels: '',
    // Chiller
    CoolingCapacity: null,
    RefrigerantType: '',
    CompressorType: '',
    // Attachments
    attachments: [] as any[],
    // Contracts
    selectedContractIds: [] as number[]
  };

  availableContracts: any[] = [];
  availableChecklists: Checklist[] = [];
  selectedChecklistId: number | null = null;
  showChecklistCreator = false;

  private unitService = inject(UnitService);
  private resource = inject(ResourceService);
  private toast = inject(ToastService);
  private checklistService = inject(ChecklistService);

  ngOnInit(): void {
    if (this.projectId) {
      this.loadContracts();
    }
    this.loadPublishedChecklists();
  }

  loadPublishedChecklists(selectChecklistId?: number) {
    this.checklistService.getAllChecklists().subscribe({
      next: (res) => {
        this.availableChecklists = (res || []).filter(c => c.status === 'Published');
        if (selectChecklistId && this.availableChecklists.some(c => c.id === selectChecklistId)) {
          this.selectedChecklistId = selectChecklistId;
        }
      },
      error: () => {
        this.availableChecklists = [];
      }
    });
  }

  openChecklistCreator(): void {
    this.showChecklistCreator = true;
  }

  closeChecklistCreator(): void {
    this.showChecklistCreator = false;
  }

  onChecklistPublished(checklistId: number): void {
    this.showChecklistCreator = false;
    this.loadPublishedChecklists(checklistId);
  }

  get filteredChecklists(): Checklist[] {
    if (!this.form.Type) return this.availableChecklists;
    const type = this.form.Type.toLowerCase().replace(/\s+|\//g, '');
    return this.availableChecklists.filter(c => {
      const sys = c.system.toLowerCase().replace(/\s+|\//g, '');
      return sys === type || sys.includes(type) || type.includes(sys);
    });
  }

  loadContracts() {
    this.resource.getAll('Contracts', { projectId: this.projectId! }).subscribe(res => {
      this.availableContracts = res || [];
    });
  }

  selectType(type: string) {
    this.form.Type = type;
    this.loading = true;
    this.unitService.getNextUnitId(this.projectId!, type).subscribe({
      next: (res: any) => {
        this.form.AutoId = res.nextId;
        this.form.SuggestedName = this.projectName
          ? `${res.suggestedName} - ${this.projectName}`
          : res.suggestedName;
        this.form.Serial = res.nextId; // Use ID as serial initially
        this.form.Model = this.form.SuggestedName;
        this.loading = false;
      },
      error: () => {
        this.toast.show('Error generating Unit ID', 'error');
        this.loading = false;
      }
    });
  }

  useSuggestion() {
    this.form.Model = this.form.SuggestedName;
  }

 nextStep() {
  if (this.step === 1 && !this.form.Type) {
    this.toast.show('Please select a unit type', 'error');
    return;
  }
  if (this.step === 2) {
    this.submitted = true;

    const missingCore = !this.form.Model || !this.form.InstallationDate;
    const missingElevatorCapacity = this.form.Type === 'Elevator' && !this.form.CapacityKg;
    const missingElevatorType = this.form.Type === 'Elevator' && !this.form.MachineType;
    const missingChillerCapacity = this.form.Type === 'Chiller' && !this.form.CoolingCapacity;
    const missingChecklist = !this.selectedChecklistId;

    if (missingCore || missingElevatorCapacity || missingElevatorType || missingChillerCapacity || missingChecklist) {
      // if (missingChecklist) this.toast.show('Please select a checklist', 'error');
      return;
    }
  }
  this.step++;
}

  prevStep() {
    this.step--;
  }

  resetWizard() {
    this.step = 1;
    this.form = {
      Type: '',
      AutoId: '',
      SuggestedName: '',
      Serial: '',
      Model: '',
      Price: 0,
      Quantity: 1,
      InstallationDate: '',
      IsModernized: false,
      ModernizationDate: '',
      Status: 'Active',
      Brand: '',
      CapacityKg: null,
      NumberOfStops: null,
      MachineRoomType: '',
      MachineType: '',
      ControllerType: '',
      ControllerName: '',
      ServingFloors: '',
      Rise: null,
      Width: null,
      Speed: null,
      Direction: '',
      ServingLevels: '',
      CoolingCapacity: null,
      RefrigerantType: '',
      CompressorType: '',
      attachments: [],
      selectedContractIds: []
    };
    this.submitted = false;
  }

  getSelectedContractsNames() {
    return this.availableContracts
      .filter(c => this.form.selectedContractIds.includes(c.id))
      .map(c => c.title)
      .join(', ') || 'No contract assigned';
  }

  toggleContract(id: number) {
    const idx = this.form.selectedContractIds.indexOf(id);
    if (idx > -1) {
      this.form.selectedContractIds.splice(idx, 1);
    } else {
      this.form.selectedContractIds.push(id);
    }
  }

  doSave() {
    if (this.saving) return;
    const payload = {
      serial: this.form.Serial,
      model: this.form.Model,
      type: this.form.Type,
      variant: this.form.MachineType || 'Standard',
      price: Number(this.form.Price || 0),
      quantity: Number(this.form.Quantity || 1),
      photos: this.form.attachments.map((a: any) => a.url),
      projectId: this.projectId,
      clientId: this.clientId,
      // Core
      installationDate: this.form.InstallationDate,
      isModernized: this.form.IsModernized,
      modernizationDate: this.form.IsModernized ? this.form.ModernizationDate : null,
      status: this.form.Status,
      // Elevator
      brand: this.form.Brand,
      capacityKg: this.form.CapacityKg,
      numberOfStops: this.form.NumberOfStops,
      machineRoomType: this.form.MachineRoomType,
      machineType: this.form.MachineType,
      controllerType: this.form.ControllerType,
      controllerName: this.form.ControllerName,
      servingFloors: this.form.ServingFloors,
      // Escalator
      rise: this.form.Rise,
      width: this.form.Width,
      speed: this.form.Speed,
      direction: this.form.Direction,
      servingLevels: this.form.ServingLevels,
      // Chiller
      coolingCapacity: this.form.CoolingCapacity,
      refrigerantType: this.form.RefrigerantType,
      compressorType: this.form.CompressorType,
      // Contracts
      contractIds: this.form.selectedContractIds,
      // Checklist
      checklistId: this.selectedChecklistId ?? undefined
    };

    console.log("Payload",payload);
    this.saving = true;
    this.loading = true;

    this.unitService.create(payload).subscribe({
      next: (res) => {
        this.save.emit(res);
        this.toast.show('Unit created and linked successfully', 'success');
        this.close.emit();
        this.loading = false;
        this.saving = false;
      },

      error: (err) => {
        console.error(err);
        this.toast.show('Failed to create unit', 'error');
        this.loading = false;
        this.saving = false;
      }
    });
  }

  doClose() {
    this.close.emit();
  }

  forceDatePicker(event: Event) {
    const target = event.target as HTMLInputElement;
    if (target.showPicker) {
      target.showPicker();
    }
  }

  openFilePicker() {
    const input = document.createElement('input');
    input.type = 'file';
    input.multiple = true;
    input.accept = 'image/*,application/pdf';
    input.onchange = (event: Event) => {
      const target = event.target as HTMLInputElement;
      const files = target.files;
      if (!files || files.length === 0) return;
      Array.from(files).forEach(file => {
        const reader = new FileReader();
        reader.onload = (e: any) => {
          this.form.attachments.push({
            name: file.name,
            type: file.type,
            url: e.target.result
          });
        };
        reader.readAsDataURL(file);
      });
    };
    input.click();
  }

  removeAttachment(index: number) {
    this.form.attachments.splice(index, 1);
  }
}
