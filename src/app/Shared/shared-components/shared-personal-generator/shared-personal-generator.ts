import { NgIf, NgFor } from '@angular/common';
import { Component, Input } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { SharedPageHeader } from "../../shared-layout/shared-page-header/shared-page-header";
@Component({
  selector: 'app-shared-personal-generator',
  imports: [ NgIf, NgFor, FormsModule, SharedPageHeader],
  templateUrl: './shared-personal-generator.html',
  styleUrl: './shared-personal-generator.css'
})
export class SharedPersonalGenerator {
 @Input() role: 'admin' | 'dispatcher' | 'manager' | 'technician'|null=null;
 ngOnInit(): void {
    this.loadTask();
  }

  loadTask(){
  
  }
  activeTab = 'Lifts';
    changeTab(tab: string) {
    this.activeTab = tab;
  }
    onSubmit() {
    console.log('Proposal sent!');
  }
  previewPDF() {
    console.log('Preview PDF clicked');
  }
  forceDatePicker(event: Event) {
    const target = event.target as HTMLInputElement;
    // التأكد أن الدالة موجودة قبل استدعائها
     if (target.showPicker) {
     target.showPicker();
      }
 }
}