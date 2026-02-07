import { Component, EventEmitter, Output } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-header',
  imports: [RouterLink],
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
