import { CommonModule } from '@angular/common';
import { Component, ElementRef, EventEmitter, Output, ViewChild } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { ResourceService } from '../../../core/resource.service';

@Component({
  selector: 'app-create-new-report',
  imports: [FormsModule,CommonModule,ReactiveFormsModule],
  templateUrl: './create-new-report.html',
  standalone: true,
  styleUrl: './create-new-report.css'
})
export class CreateNewReport {

 @Output() close = new EventEmitter<void>();
 @Output() save = new EventEmitter<any>(); // لإرسال بيانات الـ Report الجديدة
 @ViewChild('fileInput') fileInputRef!: ElementRef<HTMLInputElement>;
//for image 
 selectedFile: File | null = null;
  fileContent: string | ArrayBuffer | null = null;
  maxFileSize = 5; // MB
  allowedFileTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 'application/pdf'];
  errorMessage = '';
    previewUrl: string | null = null;

  technicians: { id: string, name: string }[] = [];
  projects: any[] = [];
  units: any[] = [];
  VisitType = ['Installation', 'Maintenance', 'Update'];
  Status = ['Done', 'Pending'];

  // متغيرات الـ Form لتمثيل الحقول في الصورة
  form = {
    systemId: '',
    unitType: '',
    reportId: '',
    maintenanceVisits: '',
    date: '',
    teamAssigned: '',
    assignedTechnician: '',
    assignedTechnicianName: '',
    visitType: '',
    status: '',
    comments: '',
    photos: [] as string[],
    files: [] as { name: string; type: string; url: string }[],
    projectId: ''
  };

  constructor(private resource: ResourceService) {}

  ngOnInit() {
    this.resource.getAll('Projects').subscribe(items => this.projects = items || []);
    this.resource.getAll('Auth/technicians').subscribe(items => this.technicians = (items || []).map((x: any) => ({ id: x.id, name: x.name })));
  }

  onProjectChange() {
    const pid = this.form.projectId ? Number(this.form.projectId) : undefined;
    const params: Record<string, string> = {};
    if (pid) params['projectId'] = String(pid);
    this.resource.getAll('Units', params).subscribe(items => this.units = items || []);
  }
 
  onTechnicianChange() {
    const found = this.technicians.find(t => t.id === this.form.assignedTechnician);
    this.form.assignedTechnicianName = found?.name || '';
  }

 triggerFileInput() {
    if (this.fileInputRef) {
      // الضغط برمجياً على حقل الـ input type="file" الأصلي
      this.fileInputRef.nativeElement.click();
    }
  }
  // الدوال
  doClose() {
    this.close.emit();
  }
submitted = false;
  doSave() {
   this.submitted = true;

  if (!this.form.systemId ||
      !this.form.status) {
    return; // ❌ يمنع الحفظ
  }

    // إرسال بيانات الـ Report الجديدة
    this.save.emit(this.form);
  }

    // دالة لفتح محدد التاريخ/الوقت عند النقر (كما فعلنا سابقاً)
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

    // حول FileList لمصفوفة File[]
    const filesArray: File[] = Array.from(files);

    filesArray.forEach((file: File) => {
      if (file.size > this.maxFileSize * 1024 * 1024) {
        console.warn(`File too large: ${file.name}`);
        return;
      }

      if (!this.allowedFileTypes.includes(file.type)) {
        console.warn(`Unsupported type: ${file.type}`);
        return;
      }

      const reader = new FileReader();
      reader.onload = () => {
        if (reader.result) {
          const url = reader.result as string;
          if (file.type.startsWith('image/')) {
            this.form.photos.push(url);
          } else {
            this.form.files.push({ name: file.name, type: file.type, url });
          }
        }
      };
      reader.readAsDataURL(file);
    });
  };

  // افتح File Picker يدويًا
  input.click();
}

 removePhoto(index: number) {
  if (index >= 0 && index < this.form.photos.length) {
    this.form.photos.splice(index, 1);
  }
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
 removeFile(index: number) {
   if (index < 0 || index >= this.form.files.length) return;
   this.form.files.splice(index, 1);
 }

}
