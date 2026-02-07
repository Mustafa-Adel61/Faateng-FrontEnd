import { Component,Output, EventEmitter } from '@angular/core';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [],
  templateUrl: './header.html',
  styleUrl: './header.css'
})
export class Header {
@Output() sidebarToggle = new EventEmitter<void>();
  // لما يدوس علي ال toggle يفتح السايدبار ويطلع بال scroll اعلي الصفحه 
sidebarToggleClick() {
  this.sidebarToggle.emit(); // دي اللي كانت بتفتح السايدبار
  window.scrollTo({ top: 0, behavior: 'smooth' }); // دي اللي تطلع الصفحة لأعلى بسلاسة
}

}
