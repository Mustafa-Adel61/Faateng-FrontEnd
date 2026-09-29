import { CommonModule, NgIf } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { RouterLink, RouterModule } from '@angular/router';
import { AuthService } from '../../../core/auth';
import { SidebarNotificationService } from '../../../core/sidebar-notification.service';

@Component({
  selector: 'app-shared-sidebar',
  standalone: true,
  imports: [NgIf,RouterLink,CommonModule,RouterModule],
  templateUrl: './shared-sidebar.html',
  styleUrl: './shared-sidebar.css'
})
export class SharedSidebar {
@Input() role: 'admin' | 'dispatcher' | 'manager' | 'technician'|'client'|'finance'|null=null;
  tasksOpen = false;
  calendarOpen = false;
  repairsOpen = false;
  reportOpen = false;
  constructor(private auth: AuthService, public notifications: SidebarNotificationService) {}
  
    logout() {
       this.auth.logout();
    }
  toggle(section: 'tasks' | 'calendar' | 'repairs'| 'report') {
/*************  ✨ Windsurf Command ⭐  *************/
/**
 * Toggle the visibility of the sidebar section based on the given section.
 * @param {string} section - The section to toggle. Can be 'tasks', 'calendar', or 'repairs'.
 */
/*******  3eee11df-8e27-4355-ac1c-3205819e3d05  *******/    if (section === 'tasks') {
      this.tasksOpen = !this.tasksOpen;
    } else if (section === 'calendar') {
      this.calendarOpen = !this.calendarOpen;
    } else if (section === 'repairs') {
      this.repairsOpen = !this.repairsOpen;
    } else if (section === 'report') {
      this.reportOpen = !this.reportOpen;
    }
  }
   scrollToTop() {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  ngOnInit(): void {
    this.notifications.refresh();
  }

  getChecklistLink(): any[] {
    const role = this.auth.getRole();
    if (role === 'admin' || role === 'manager' || role === 'dispatcher') {
      return ['/dashboard/admin/submissions'];
    }
    return ['/dashboard/admin/checklist'];
  }

  getChecklistsLink(): any[] {
    return ['/dashboard/admin/checklists'];
  }

  getDashboardPath(): string {
    return `/dashboard/${this.role}`;
  }

  @Output() closeSidebar = new EventEmitter<void>();

  closeSidebarOnMobile() {
    if (window.innerWidth <= 900) {
      this.closeSidebar.emit();
    }
  }
}
