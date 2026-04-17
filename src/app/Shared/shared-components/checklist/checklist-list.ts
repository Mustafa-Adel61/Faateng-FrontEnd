import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ChecklistService, ChecklistSubmission } from '../../services/checklist.service';
import { AuthService } from '../../../core/auth';

@Component({
  selector: 'app-checklist-list',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './checklist-list.html',
  styleUrls: ['./checklist-list.css']
})
export class ChecklistList implements OnInit {
  submissions: ChecklistSubmission[] = [];
  isLoading: boolean = true;
  isAdmin: boolean = false;
  role: string | null = null;

  constructor(
    private checklistService: ChecklistService,
    private auth: AuthService
  ) {}

  ngOnInit() {
    this.role = this.auth.getRole();
    this.isAdmin = this.role === 'admin' || this.role === 'manager';
    this.loadSubmissions();
  }

  getDashboardPath(): string {
    return `/dashboard/${this.role}`;
  }

  loadSubmissions() {
    this.checklistService.getAllSubmissions().subscribe(res => {
      this.submissions = res;
      this.isLoading = false;
    });
  }

  formatDate(dateStr: string) {
    return new Date(dateStr).toLocaleDateString();
  }
}
