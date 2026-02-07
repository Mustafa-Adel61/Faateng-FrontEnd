import { NgIf } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';

@Component({
  selector: 'app-shared-header',
  standalone: true,
  imports: [NgIf,RouterLink],
  templateUrl: './shared-header.html',
  styleUrl: './shared-header.css'
})
export class SharedHeader {
  @Input() role: 'admin' | 'dispatcher' | 'manager' | 'technician'|'client'|'finance'|null=null;

@Output() sidebarToggle = new EventEmitter<void>();
  // لما يدوس علي ال toggle يفتح السايدبار ويطلع بال scroll اعلي الصفحه 
sidebarToggleClick() {
  this.sidebarToggle.emit(); // دي اللي كانت بتفتح السايدبار
  window.scrollTo({ top: 0, behavior: 'smooth' }); // دي اللي تطلع الصفحة لأعلى بسلاسة
}
ngOnInit(): void {
  //Called after the constructor, initializing input properties, and the first call to ngOnChanges.
  //Add 'implements OnInit' to the class.
  console.log("Role in Header",this.role);
  
}
}
