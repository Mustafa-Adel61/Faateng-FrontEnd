import { Component, Output, EventEmitter } from '@angular/core';
import { AuthService } from '../../../core/auth';
import { RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-sidebar',
  imports: [CommonModule,RouterLink],
  templateUrl: './sidebar.html',
  styleUrl: './sidebar.css'
})
export class Sidebar {
tasksOpen = false;
  calendarOpen = false;
  repairsOpen = false;
  constructor(private auth: AuthService) {}
  
    logout() {
       this.auth.logout();
    }
  toggle(section: 'tasks' | 'calendar' | 'repairs') {
    if (section === 'tasks') {
      this.tasksOpen = !this.tasksOpen;
    } else if (section === 'calendar') {
      this.calendarOpen = !this.calendarOpen;
    } else if (section === 'repairs') {
      this.repairsOpen = !this.repairsOpen;
    }
  }
   scrollToTop() {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
  @Output() closeSidebar = new EventEmitter<void>();

  closeSidebarOnMobile() {
    if (window.innerWidth <= 900) {
      this.closeSidebar.emit();
    }
  }
}
