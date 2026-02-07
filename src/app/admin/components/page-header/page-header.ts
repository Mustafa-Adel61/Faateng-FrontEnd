import { NgIf } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';

@Component({
  selector: 'app-page-header',
  imports: [NgIf],
  templateUrl: './page-header.html',
  styleUrl: './page-header.css'
})
export class PageHeader {
  
 @Output() createVisit = new EventEmitter<void>();
 //المكان الي مش هستخدم فيهم الزرار دا هيتشال 
 @Input() showCreateVisitButton: boolean = true; 
 @Input() createButtonLabel: string = 'CREATE NEW VISIT'; // اسم الزرار قابل للتغيير
@Input() showSerchBox: boolean = true;
  // خاصية جديدة للتحكم في ظهور قائمة Dropdown
  @Input() showDropdown: boolean = true; // <--- الإضافة الجديدة

  onCreateClick() {
    this.createVisit.emit();
  }
}
