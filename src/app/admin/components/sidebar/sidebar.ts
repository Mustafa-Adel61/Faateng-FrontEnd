import { CommonModule, NgIf } from '@angular/common';
import { Component, EventEmitter, Output } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../../core/auth';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [NgIf,RouterLink,CommonModule],
  templateUrl: './sidebar.html',
  styleUrls: ['./sidebar.css']
})
export class Sidebar {
  tasksOpen = false;
  calendarOpen = false;
  repairsOpen = false;
  reportOpen = false;
  constructor(private auth: AuthService) {}
  
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
  @Output() closeSidebar = new EventEmitter<void>();

  closeSidebarOnMobile() {
    if (window.innerWidth <= 900) {
      this.closeSidebar.emit();
    }
  }
  
}
