import { NgClass, NgFor, NgIf, CommonModule } from '@angular/common';
import { Component, EventEmitter, Output, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ResourceService } from '../../../core/resource.service';
import { Loading } from '../../../Shared/shared-components/loading/loading';

@Component({
  selector: 'app-create-new-contact',
  imports: [FormsModule,NgFor,NgClass,CommonModule, Loading],
  templateUrl: './create-new-contact.html',
  styleUrl: './create-new-contact.css'
})
export class CreateNewContact implements OnInit {

   @Output() close = new EventEmitter<void>();
  @Output() save = new EventEmitter<any>();

  clients: { id: string, name: string, email?: string }[] = [];
  selectedClientId: string | null = null;

  projects: { id: number, name: string, projectIdStr?: string }[] = [];
  selectedProjectId: number | null = null;

  availableUnits: { id: number, serial: string, model: string, type: string }[] = [];
  selectedUnitIds: number[] = [];

  maxFileSize = 10;
  allowedFileTypes = ['image/jpeg','image/jpg','image/png','image/gif','image/webp','application/pdf'];
  Types=['Maintenance', 'Turnkey', 'Supply','Service'];
  // Types=['AMC', 'Warranty', 'OnDemand'];
  BillingCycles=['Weekly','Monthly','Every 2 months', 'Quarterly', 'Annual', 'One-off'];
  form = {
    Title: '',
    Type: '',
    Start: '',
    End: '',
    BillingCycle: '',
    AmountperCycle: 0,
    Photos: [] as string[],
    Files: [] as { name: string; type: string; url: string }[]
  };

  constructor(private resource: ResourceService) {}
  loading: boolean = false;

 ngOnInit() {
    this.loadClients();
 }

 loadClients() {
    this.loading = true;
    this.resource.getAll('Contracts/clients').subscribe({
      next: (list: any) => {
        this.clients = (list || []).map((c: any) => ({ id: c.id, name: c.fullName || c.name, email: c.email }));
      },
      error: () => { this.clients = []; },
      complete: () => { this.loading = false; }
    });
 }

 onClientChange() {
    this.projects = [];
    this.selectedProjectId = null;
    this.availableUnits = [];
    this.selectedUnitIds = [];

    if (!this.selectedClientId) return;

    this.loading = true;
    this.resource.getAll(`Contracts/projects/by-client/${this.selectedClientId}`).subscribe({
      next: (list: any) => {
        this.projects = (list || []).map((p: any) => ({
          id: p.id,
          name: p.name,
          projectIdStr: p.projectIdStr
        }));
      },
      error: () => { this.projects = []; },
      complete: () => { this.loading = false; }
    });
 }

 onProjectChange() {
    this.availableUnits = [];
    this.selectedUnitIds = [];

    if (!this.selectedProjectId) return;

    this.loading = true;
    this.resource.getAll(`Contracts/units/by-project/${this.selectedProjectId}`).subscribe({
      next: (list: any) => {
        this.availableUnits = (list || []).map((u: any) => ({
          id: u.id,
          serial: u.serial,
          model: u.model,
          type: u.type
        }));
      },
      error: () => { this.availableUnits = []; },
      complete: () => { this.loading = false; }
    });
 }

 onUnitToggle(unitId: number) {
    const idx = this.selectedUnitIds.indexOf(unitId);
    if (idx >= 0) {
      this.selectedUnitIds.splice(idx, 1);
    } else {
      this.selectedUnitIds.push(unitId);
    }
 }

  doClose() {
    this.close.emit();
  }

 submitted = false;

  doSave() {
      this.submitted = true;
      if(
      !this.selectedClientId ||
      !this.form.Type ||
      !this.form.Start ||
      !this.form.End ||
      !this.form.BillingCycle ||
      !this.selectedProjectId
  ) {
    return;
  }

    this.form.Title = this.form.Title || `${this.clients.find(c => c.id === this.selectedClientId)?.name || 'Contract'} - ${this.projects.find(p => p.id === this.selectedProjectId)?.name || ''}`;

    this.loading = true;
    const payload = {
      ...this.form,
      ClientId: this.selectedClientId,
      ProjectId: this.selectedProjectId,
      UnitIds: this.selectedUnitIds.length > 0 ? this.selectedUnitIds : [0]
    };
    this.save.emit(payload);
  }

  forceDatePicker(event: Event) {
    const target = event.target as HTMLInputElement;
    // التأكد أن الدالة موجودة قبل استدعائها
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
        if (file.size > this.maxFileSize * 1024 * 1024) return;
        if (!this.allowedFileTypes.includes(file.type)) return;
        const reader = new FileReader();
        reader.onload = () => {
          if (!reader.result) return;
          const url = reader.result as string;
          if (file.type.startsWith('image/')) {
            this.form.Photos.push(url);
          } else {
            this.form.Files.push({ name: file.name, type: file.type, url });
          }
        };
        reader.readAsDataURL(file);
      });
    };
    input.click();
  }
  removeFile(index: number) {
    if (index < 0 || index >= this.form.Files.length) return;
    this.form.Files.splice(index, 1);
  }
  removePhoto(index: number) {
    if (index < 0 || index >= this.form.Photos.length) return;
    this.form.Photos.splice(index, 1);
  }
  openUrl(url: string, name?: string) {
    const w = window.open('', '_blank');
    if (!w) return;
    const isPdf = url.startsWith('data:application/pdf') || /\.pdf($|\?)/i.test(url);
    const content = isPdf
      ? `<embed src="${url}" type="application/pdf" style="width:100%;height:95vh;">`
      : `<img src="${url}" style="max-width:100%;height:auto;">`;
    const download = `<a href="${url}" download="${name || 'download'}" style="margin:10px 0;display:inline-block;">Download</a>`;
    w.document.write(`<!doctype html><html><head><title>Preview</title></head><body>${content}<div>${download}</div></body></html>`);
    w.document.close();
  }
}
