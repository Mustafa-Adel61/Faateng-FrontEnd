import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ChecklistService, SubmissionListItem } from '../../services/checklist.service';
import { AuthService } from '../../../core/auth';

@Component({
  selector: 'app-checklist-list',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './checklist-list.html',
  styleUrls: ['./checklist-list.css']
})
export class ChecklistList implements OnInit {
  submissions: SubmissionListItem[] = [];
  isLoading: boolean = true;
  isAdmin: boolean = false;
  role: string | null = null;

  constructor(
    private checklistService: ChecklistService,
    private auth: AuthService
  ) {}

  ngOnInit() {
    this.role = this.auth.getRole();
    console.log('Role:', this.role);
    this.isAdmin = this.role === 'admin' || this.role === 'manager'|| this.role === 'dispatcher';
    this.loadSubmissions();
  }

  getDashboardPath(): string {
    return '/dashboard/admin/submissions';
  }

  loadSubmissions() {
    this.checklistService.getAllSubmissions().subscribe(res => {
      this.submissions = res;
      console.log('Loaded submissions:', this.submissions);
      this.isLoading = false;
    });
  }

  formatDate(dateStr: string) {
    return new Date(dateStr).toLocaleDateString();
  }
}
