import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ActivatedRoute } from '@angular/router';
import { ChecklistService, ChecklistSubmissionDetail, ChecklistAnswer } from '../../../Shared/services/checklist.service';
import { AuthService } from '../../../core/auth';

@Component({
  selector: 'app-submission-detail',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './submission-detail.html',
  styleUrls: ['./submission-detail.css']
})
export class SubmissionDetail implements OnInit {
  submission: ChecklistSubmissionDetail | null = null;
  isLoading = true;
  showReviewedToast = false;
  isMarkingReviewed = false;
    role: string | null = null;

  constructor(
    private route: ActivatedRoute,
    private checklistService: ChecklistService,
    private auth: AuthService
  ) {}

  ngOnInit() {
        this.role = this.auth.getRole();
    const idParam = this.route.snapshot.paramMap.get('id');
    if (idParam) {
      const id = Number(idParam);
      this.loadSubmissionDetails(id);
    }
  }

  loadSubmissionDetails(id: number) {
    this.isLoading = true;
    this.checklistService.getSubmissionDetails(id).subscribe({
      next: (data) => {
        this.submission = data;
        this.isLoading = false;
      },
      error: () => {
        this.submission = null;
        this.isLoading = false;
      }
    });
  }

  formatDate(dateStr: string): string {
    if (!dateStr) return '';
    try {
      return new Date(dateStr).toLocaleDateString();
    } catch {
      return dateStr;
    }
  }

  getMainStatusClass(status: string): string {
    switch (status) {
      case 'Submitted':
        return 'main-badge-green';
      case 'Reviewed':
        return 'main-badge-blue';
      default:
        return 'main-badge-gray';
    }
  }

  private isPassingStatus(status: string): boolean {
    return status === 'Pass' || status === 'Passed';
  }

  private isFailingStatus(status: string): boolean {
    return status === 'Fail' || status === 'Failed';
  }

  getAnswerStatusClass(status: string): string {
    if (this.isPassingStatus(status)) return 'answer-badge-green';
    if (this.isFailingStatus(status)) return 'answer-badge-red';
    if (status === 'N/A') return 'answer-badge-gray';
    return 'answer-badge-gray';
  }

  get visibleAnswers(): ChecklistAnswer[] {
    return this.submission?.answers || [];
  }

  countAnswersByStatus(status: string): number {
    if (status === 'Passed') {
      return this.visibleAnswers.filter((a: ChecklistAnswer) => this.isPassingStatus(a.status)).length;
    }
    if (status === 'Failed') {
      return this.visibleAnswers.filter((a: ChecklistAnswer) => this.isFailingStatus(a.status)).length;
    }
    return this.visibleAnswers.filter((a: ChecklistAnswer) => a.status === status).length;
  }

  calculateScore(): number {
    if (!this.visibleAnswers.length) return 0;
    const relevant = this.visibleAnswers.filter((a: ChecklistAnswer) => this.isPassingStatus(a.status) || this.isFailingStatus(a.status));
    if (!relevant.length) return 0;
    const passed = relevant.filter((a: ChecklistAnswer) => this.isPassingStatus(a.status)).length;
    return Math.round((passed / relevant.length) * 100);
  }

  getDisplayValue(answer: ChecklistAnswer): string {
    if (answer.value) return answer.value;
    if (answer.numericValue !== undefined && answer.numericValue !== null) return String(answer.numericValue);
    return '—';
  }

  getDisplayValueLabel(answer: ChecklistAnswer): string {
    if (answer.numericValue !== undefined && answer.numericValue !== null) return 'Numeric';
    if (answer.value) return 'Text';
    return '—';
  }

  getDisplayNotes(answer: ChecklistAnswer): string {
    return answer.notes || '—';
  }

  getQuestionText(answer: ChecklistAnswer): string {
    return answer.questionTextEn || answer.questionTextAr || `Question ${answer.questionId}`;
  }

  exportPrint() {
    window.print();
  }

  markAsReviewed() {
    if (!this.submission || this.isMarkingReviewed) return;
    this.isMarkingReviewed = true;
    this.checklistService.markSubmissionReviewed(this.submission.id).subscribe({
      next: () => {
        if (this.submission) {
          this.submission.status = 'Reviewed';
        }
        this.showReviewedToast = true;
        this.isMarkingReviewed = false;
        setTimeout(() => {
          this.showReviewedToast = false;
        }, 3500);
      },
      error: () => {
        this.isMarkingReviewed = false;
      }
    });
  }

  trackByAnswer(index: number, answer: ChecklistAnswer): number {
    return answer.questionId || index;
  }
}
