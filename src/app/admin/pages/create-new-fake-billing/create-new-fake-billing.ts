import { Component, EventEmitter, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-create-new-fake-billing',
  imports: [FormsModule],
  templateUrl: './create-new-fake-billing.html',
  styleUrl: './create-new-fake-billing.css'
})
export class CreateNewFakeBilling {

 @Output() close = new EventEmitter<void>();
 @Output() save = new EventEmitter<any>(); // لإرسال بيانات الـ Report الجديدة


  ServiceTypes=['Installation', 'Maintenance', 'Update'];
  // متغيرات الـ Form لتمثيل الحقول في الصورة
  form = {
    projectName: '',
    invoiceNumber: '',
    dueDate: '',
    billingDate: '',
 };


  // الدوال
  doClose() {
    this.close.emit();
  }

  doSave() {
    // إرسال بيانات الـ Report الجديدة
    this.save.emit(this.form);
  }
forceDatePicker(event: Event) {
    const target = event.target as HTMLInputElement;
    // التأكد أن الدالة موجودة قبل استدعائها
    if (target.showPicker) {
      target.showPicker();
    }
  }

}
