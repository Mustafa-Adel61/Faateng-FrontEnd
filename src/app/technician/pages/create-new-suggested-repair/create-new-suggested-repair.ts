import { CommonModule } from '@angular/common';
import { Component, ElementRef, EventEmitter, Input, OnInit, Output, ViewChild } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
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

 @ViewChild('fileInputRef') fileInputRef!: ElementRef<HTMLInputElement>;
 //for image 
 selectedFile: File | null = null;
  fileContent: string | ArrayBuffer | null = null;
  maxFileSize = 5; // MB
  allowedFileTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
  errorMessage = '';
    previewUrl: string | null = null;

 Priority = ['Critical', 'High','Medium'];
 Status = ['Under Review', 'Draft','Approved'];
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

 ngOnInit() {
   if (this.initialData) {
     this.form.ProjectName = this.initialData.projectName || this.initialData.name || '';
     this.form.TechnicalName = this.initialData.assignee || '';
     this.form.UnitType = this.initialData.units || '';
     this.form.Location = this.initialData.address || '';
     this.form.IssueDescription = this.initialData.objective || '';
   }
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
   this.submitted = true;

  if (!this.form.ProjectName || 
      !this.form.TechnicalName ||
      !this.form.UnitType ||
      !this.form.Location||
      !this.form.IssueDescription||
      !this.form.SuggestedRepair) {
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
  input.accept = 'image/*'; // الصور فقط

  input.onchange = (event: Event) => {
    const target = event.target as HTMLInputElement;
    const files = target.files;
    if (!files || files.length === 0) return;

    // فضي الصور القديمة
    this.form.images = [];

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
        // تأكد إن النتيجة Base64 string صالحة
        if (reader.result) {
          this.form.images.push(reader.result as string);
        }
      };
      reader.readAsDataURL(file);
    });
  };

  // افتح File Picker يدويًا
  input.click();
}

}
