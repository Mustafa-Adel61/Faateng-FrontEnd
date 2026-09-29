import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { ChecklistService, ChecklistSubmissionDetail } from '../../services/checklist.service';
import { AuthService } from '../../../core/auth';

@Component({
  selector: 'app-checklist-details',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './checklist-details.html',
  styleUrls: ['./checklist-details.css']
})
export class ChecklistDetails implements OnInit {
  submission: ChecklistSubmissionDetail | null = null;
  isLoading: boolean = true;
  role: string | null = null;

  constructor(
    private route: ActivatedRoute,
    private checklistService: ChecklistService,
    private auth: AuthService
  ) {}

  ngOnInit() {
    this.role = this.auth.getRole();
    console.log('Role:', this.role);
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.loadDetails(Number(id));
    }
  }

  getDashboardPath(): string {
    return '/dashboard/admin/submissions';
  }

  loadDetails(id: number) {
    this.checklistService.getSubmissionDetails(id).subscribe(res => {
      this.submission = res;
      this.isLoading = false;
    });
  }

  formatDate(dateStr: string) {
    return new Date(dateStr).toLocaleString();
  }
}
