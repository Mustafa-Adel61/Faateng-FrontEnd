import { CommonModule } from '@angular/common';
import { Component,Output,EventEmitter } from '@angular/core';
import { RouterLink } from '@angular/router';
import { SidebarNotificationService } from '../../../core/sidebar-notification.service';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './header.html',
  styleUrl: './header.css'
})
export class Header {
  notificationsOpen = false;

  constructor(public notifications: SidebarNotificationService) {}

  ngOnInit(): void {
    this.notifications.refresh();
  }

  toggleNotifications(): void {
    this.notificationsOpen = !this.notificationsOpen;
  }

  closeNotifications(): void {
    this.notificationsOpen = false;
  }

  @Output() sidebarToggle = new EventEmitter<void>();
  // لما يدوس علي ال toggle يفتح السايدبار ويطلع بال scroll اعلي الصفحه 
sidebarToggleClick() {
  this.sidebarToggle.emit(); // دي اللي كانت بتفتح السايدبار
  window.scrollTo({ top: 0, behavior: 'smooth' }); // دي اللي تطلع الصفحة لأعلى بسلاسة
}

}
