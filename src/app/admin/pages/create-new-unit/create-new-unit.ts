import { Component, EventEmitter, Output, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { UnitService } from '../../../core/unit.service';
import { Loading } from '../../../Shared/shared-components/loading/loading';
import { ResourceService } from '../../../core/resource.service';
import { ToastService } from '../../../Shared/services/toast.service';

@Component({
  selector: 'app-create-new-unit',
  standalone: true,
  imports: [FormsModule, CommonModule, HttpClientModule, Loading],
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

  unitTypes = [
    'Elevator', 'Escalator', 'Moving Walk',
    'AHU', 'FCU', 'VRF / DX', 'Chiller', 'Cooling Tower',
    'Pump', 'Exhaust/Supply Fan', 'Package / Rooftop Unit'
  ];

  form = {
    Serial: '',
    Model: '',
    Type: '',
    Variant: '',
    Price: null,
    Quantity: null,
    Description: '',
    attachments: [] as { name: string; type: string; url: string }[]
  };

  variants = ['AC Gearless', 'AC Geared'];

  submitted = false;
  maxFileSize = 10; // MB
  allowedFileTypes = ['image/jpeg','image/jpg','image/png','image/gif','image/webp','application/pdf'];

  constructor(
    private unitService: UnitService, 
    private http: HttpClient, 
    private resource: ResourceService,
    private toast: ToastService
  ) {}
  loading: boolean = false;

  ngOnInit(): void {
    // If names are not provided but IDs are, fetch them?
    // For now assume they are passed from project-details
  }

  doClose() {
    this.close.emit();
  }

  doSave() {
    this.submitted = true;
    if (!this.form.Serial || !this.form.Model || !this.form.Type || !this.form.Price || !this.form.Quantity) {
      return;
    }

    const payload = {
      serial: this.form.Serial,
      model: this.form.Model,
      type: this.form.Type,
      variant: this.form.Type === 'Elevator' ? this.form.Variant : null,
      price: Number(this.form.Price),
      quantity: Number(this.form.Quantity),
      photos: this.form.attachments.map(a => a.url),
      projectId: this.projectId,
      clientId: this.clientId
    };

    this.loading = true;
    this.unitService.create(payload).subscribe({
      next: (res) => {
        this.save.emit(res);
        this.toast.show('Unit created successfully', 'success');
        this.doClose();
        this.loading = false;
      },
      error: (err) => {
        console.error(err);
        this.toast.show('Failed to create unit', 'error');
        this.loading = false;
      }
    });
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
        if (file.size > this.maxFileSize * 1024 * 1024) return;
        if (!this.allowedFileTypes.includes(file.type)) return;
        const reader = new FileReader();
        reader.onload = (e: any) => {
          if (!e.target.result) return;
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

  openAttachment(file: any) {
    // Open in new tab
    const win = window.open();
    if (win) {
      win.document.write('<iframe src="' + file.url + '" frameborder="0" style="border:0; top:0px; left:0px; bottom:0px; right:0px; width:100%; height:100%;" allowfullscreen></iframe>');
    }
  }
}
