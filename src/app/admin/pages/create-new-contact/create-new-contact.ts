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
  @Output() save = new EventEmitter<any>(); // لإرسال بيانات الـ Report الجديدة

  clients: { id: string, name: string }[] = [];
  selectedClientId: string | null = null;

  maxFileSize = 10; // MB
  allowedFileTypes = ['image/jpeg','image/jpg','image/png','image/gif','image/webp','application/pdf'];

  // ServiceTypes=['Installation', 'Maintenance', 'Update'];
  Types=['Maintenance', 'Turnkey','Supply','Service'];
  BillingCycles=['Monthly', 'Quarterly', 'Annual','One-off'];
  // متغيرات الـ Form لتمثيل الحقول في الصورة
  form = {
    Client: '',
    Type: '',
    LinkedProject: '',
    Start: '',
    End: '',
    BillingCycle: '',
    AmountperCycle:0,
    Photos: [] as string[],
    Files: [] as { name: string; type: string; url: string }[]
 };

  constructor(private resource: ResourceService) {}
  loading: boolean = false;

 ngOnInit() {
    this.loading = true;
    this.resource.getAll('Users/clients').subscribe({
      next: (list) => {
        this.clients = (list || []).map((c: any) => ({ id: c.id, name: c.name }));
      },
      error: () => { this.clients = []; },
      complete: () => { this.loading = false; }
    });
 }

//  //دي الي كانت في الاول قبل تعديل ال client
//   form = {
//     ClientCompanyName: '',
//     phoneNumber: '',
//     emailAddress: '',
//     location: '',
//     serviceType: '',
//  };


  // الدوال
  doClose() {
    this.close.emit();
  }
submitted = false;

  doSave() {
      this.submitted = true;
  if(
      !this.selectedClientId||
      !this.form.Type||
      !this.form.Start||
      !this.form.End||
      !this.form.BillingCycle||
      !this.form.LinkedProject
  ){
    return; // ❌ يمنع الحفظ
  }
    // إرسال بيانات الـ Report الجديدة
    this.loading = true;
    this.save.emit({ ...this.form, ClientId: this.selectedClientId });
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
