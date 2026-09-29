import { NgFor, NgIf } from '@angular/common';
import { Component, EventEmitter, HostListener, Input, Output } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { SidebarNotificationService } from '../../../core/sidebar-notification.service';

@Component({
  selector: 'app-shared-header',
  standalone: true,
  imports: [NgIf, NgFor, RouterLink, RouterLinkActive],
  templateUrl: './shared-header.html',
  styleUrl: './shared-header.css'
})
export class SharedHeader {
  @Input() role: 'admin' | 'dispatcher' | 'manager' | 'technician' | 'client' | 'finance' | null = null;

  @Output() sidebarToggle = new EventEmitter<void>();

  notificationsOpen = false;

  constructor(public notifications: SidebarNotificationService) {}

  // لما يدوس علي ال toggle يفتح السايدبار ويطلع بال scroll اعلي الصفحه
  sidebarToggleClick() {
    this.sidebarToggle.emit(); // دي اللي كانت بتفتح السايدبار
    window.scrollTo({ top: 0, behavior: 'smooth' }); // دي اللي تطلع الصفحة لأعلى بسلاسة
  }

  get notificationItems() {
    return this.notifications.getNotificationItems(this.role);
  }

  toggleNotifications(): void {
    this.notificationsOpen = !this.notificationsOpen;
    if (this.notificationsOpen) {
      this.notifications.refresh();
    }
  }

  closeNotifications(): void {
    this.notificationsOpen = false;
  }

  @HostListener('document:click')
  onDocumentClick(): void {
    if (this.notificationsOpen) {
      this.notificationsOpen = false;
    }
  }

  ngOnInit(): void {
    this.notifications.refresh();
  }
}
