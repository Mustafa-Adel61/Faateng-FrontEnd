import { CommonModule } from '@angular/common';
import { Component, ElementRef, EventEmitter, Input, OnInit, Output, ViewChild } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { ResourceService } from '../../../core/resource.service';

@Component({
  selector: 'app-create-new-report',
  imports: [FormsModule,CommonModule,ReactiveFormsModule],
  templateUrl: './create-new-report.html',
  standalone: true,
  styleUrl: './create-new-report.css'
})
export class CreateNewReport implements OnInit {

 @Output() close = new EventEmitter<void>();
 @Output() save = new EventEmitter<any>(); // لإرسال بيانات الـ Report الجديدة
 @Input() saving = false; // Parent-driven: true while the POST is still in flight
 @ViewChild('fileInput') fileInputRef!: ElementRef<HTMLInputElement>;

 technicians: { id: string, name: string }[] = [];
 projects: any[] = [];
 units: any[] = [];
 VisitType = ['Installation', 'Maintenance', 'Update'];
 Status = ['Submitted', 'Returned', 'Approved', 'Rejected'];

 // ✅ رقم التقرير يتولد تلقائياً بشكل MR-001 و uniqe
 autoReportId = '';

 form = {
   unitIds: [] as number[],      // ⬅️ أكتر من Unit
   visitType: '',
   date: '',
   assignedTechnician: '',
   assignedTechnicianName: '',
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
   this.generateReportId();
 }

 // توليد الرقم التالي MR-XXX من كل التقارير الموجودة
 generateReportId() {
   this.resource.getAll('Reports').subscribe(items => {
     let max = 0;
     (items || []).forEach((r: any) => {
       const m = /^MR-(\d+)$/i.exec(String(r.reportId || ''));
       if (m) max = Math.max(max, parseInt(m[1], 10));
     });
     this.autoReportId = `MR-${String(max + 1).padStart(3, '0')}`;
   });
 }

 onProjectChange() {
   const pid = this.form.projectId ? Number(this.form.projectId) : undefined;
   const params: Record<string, string> = {};
   if (pid) params['projectId'] = String(pid);
   this.resource.getAll('Units', params).subscribe(items => {
     this.units = items || [];
     // امسح الوحدات اللي كانت مختارة لو المشروع اتغير
     const validIds = new Set(this.units.map((u: any) => Number(u.id)));
     this.form.unitIds = this.form.unitIds.filter(id => validIds.has(id));
   });
 }

 onUnitToggle(unitId: number) {
   const idx = this.form.unitIds.indexOf(unitId);
   if (idx > -1) this.form.unitIds.splice(idx, 1);
   else this.form.unitIds.push(unitId);
 }

 isUnitSelected(u: any): boolean {
   return u?.id != null && this.form.unitIds.includes(Number(u.id));
 }

 toggleUnit(u: any) {
   if (u?.id == null) return;
   this.onUnitToggle(Number(u.id));
 }

 onTechnicianChange() {
   const found = this.technicians.find(t => t.id === this.form.assignedTechnician);
   this.form.assignedTechnicianName = found?.name || '';
 }

 triggerFileInput() {
    if (this.fileInputRef) {
      this.fileInputRef.nativeElement.click();
    }
  }
  doClose() {
    this.close.emit();
  }
submitted = false;
  doSave() {
    if (this.saving) return;
   this.submitted = true;

 if (!this.form.unitIds.length || !this.form.status) {
   return; // ❌ يمنع الحفظ
 }

    // إرسال بيانات الـ Report الجديدة
    this.save.emit(this.form);
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

    const filesArray: File[] = Array.from(files);

    filesArray.forEach((file: File) => {
      if (file.size > 5 * 1024 * 1024) {
        console.warn(`File too large: ${file.name}`);
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
