import { CommonModule } from '@angular/common';
import { Component, ElementRef, EventEmitter, Input, OnInit, Output, ViewChild } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { ResourceService } from '../../../core/resource.service';
import { AuthService } from '../../../core/auth';
import { downscaleImageFile } from '../../../core/image-utils';
@Component({
  selector: 'app-create-new-suggested-repair',
  imports: [FormsModule,CommonModule,ReactiveFormsModule],
  templateUrl: './create-new-suggested-repair.html',
  styleUrl: './create-new-suggested-repair.css'
})
export class CreateNewSuggestedRepair implements OnInit {
 @Output() close = new EventEmitter<void>();
 @Output() save = new EventEmitter<any>(); // لإرسال بيانات الـ Report الجديدة
 @Input() initialData: any = null; // Input to pre-fill data
 @Input() saving = false; // Parent-driven: true while the POST is still in flight

 @ViewChild('fileInputRef') fileInputRef!: ElementRef<HTMLInputElement>;
 //for image
 selectedFile: File | null = null;
  fileContent: string | ArrayBuffer | null = null;
  maxFileSize = 5; // MB
  allowedFileTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    errorMessage = '';
    previewUrl: string | null = null;
  processingPhotos = false;

 Priority = ['Critical', 'High','Medium'];
 Status = ['Under Review', 'Draft','Approved'];
 projects: { id: number, name: string }[] = [];
 units: { id: number, model: string, serial: string }[] = [];
 selectedProjectId: number | null = null;
 selectedUnitId: number | null = null;
 form = {
 Code: '',
 ProjectName: '',
 TechnicalName: '',
 maintenanceVisits: '',
 UnitType: '',
 Location: '',
 IssueDescription: '',
 SuggestedRepair: '',
 Score: 0,
 Priority: '',
 Status: '',
 images: [] as string[]
 };
 isTechnician: boolean = false;

 constructor(private resource: ResourceService, private auth: AuthService) { }
 ngOnInit() {
   const role = this.auth.currentRole();
   this.isTechnician = role === 'technician';
   
   if (this.isTechnician) {
     this.form.Status = 'Under Review';
   }
   
   if (this.initialData) {
     this.form.ProjectName = this.initialData.projectName || this.initialData.name || '';
     this.form.UnitType = this.initialData.units || '';
     this.form.IssueDescription = this.initialData.objective || '';
   }
  this.loadProjects();
 }
 loadProjects() {
  this.resource.getAll('Tasks/my-projects').subscribe({
    next: (items) => { this.projects = Array.isArray(items) ? items : []; },
    error: () => { this.projects = []; }
  });
 }
 onProjectChange() {
  if (!this.selectedProjectId) { this.units = []; return; }
  this.resource.getAll('Tasks/my-units', { projectId: String(this.selectedProjectId) }).subscribe({
    next: (items) => { this.units = Array.isArray(items) ? items : []; },
    error: () => { this.units = []; }
  });
 }
 onUnitChange() {
  const u = this.units.find(x => x.id === this.selectedUnitId);
  this.form.UnitType = u ? (u.model || '') : '';
 }

 triggerFileInput() {
 if (this.fileInputRef) {
 // الضغط برمجياً على حقل الـ input type="file" الأصلي
 this.fileInputRef.nativeElement.click(); }
 }
 // الدوال
 doClose() {
 this.close.emit();
 }
 submitted = false;
  doSave() {
    // منع الإرسال مرتين أثناء انتظار رد الـ backend
    if (this.saving || this.processingPhotos) return;
   this.submitted = true;


  //  if (!this.form.ProjectName ||
  //     !this.selectedUnitId ||
  //     !this.form.IssueDescription||
  //     !this.form.SuggestedRepair) {
  //   return; // ❌ يمنع الحفظ
  // }

 // إرسال بيانات الـ Report الجديدة
 const payload = {
   ...this.form,
   UnitId: this.selectedUnitId
 };
 this.save.emit(payload);
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
  input.accept = 'image/*'; // الصور فقط

  input.onchange = async (event: Event) => {
    const target = event.target as HTMLInputElement;
    const files = target.files;
    if (!files || files.length === 0) return;

    // فضي الصور القديمة
    this.form.images = [];
    this.processingPhotos = true;

    // حول FileList لمصفوفة File[]
    const filesArray: File[] = Array.from(files);
    const accepted: string[] = [];

    for (const file of filesArray) {
      if (file.size > this.maxFileSize * 1024 * 1024) {
        console.warn(`File too large: ${file.name}`);
        continue;
      }

      if (!this.allowedFileTypes.includes(file.type)) {
        console.warn(`Unsupported type: ${file.type}`);
        continue;
      }

      accepted.push(await downscaleImageFile(file));
    }

    this.form.images = accepted;
    this.processingPhotos = false;
  };
  // افتح File Picker يدويًا
  input.click();
}

 removeImage(index: number) {
   if (index >= 0 && index < this.form.images.length) {
     this.form.images.splice(index, 1);
   }
 }
}
