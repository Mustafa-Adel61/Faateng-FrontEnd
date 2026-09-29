import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Subject, debounceTime, distinctUntilChanged, takeUntil } from 'rxjs';
import { ChecklistService, SubmissionListItem } from '../../../Shared/services/checklist.service';

@Component({
  selector: 'app-submissions',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './submissions.html',
  styleUrls: ['./submissions.css']
})
export class Submissions implements OnInit, OnDestroy {
  submissions: SubmissionListItem[] = [];
  filteredSubmissions: SubmissionListItem[] = [];
  searchQuery = '';
  isLoading = true;
  private readonly searchInput$ = new Subject<string>();
  private readonly destroy$ = new Subject<void>();

  constructor(
    private checklistService: ChecklistService,
    private router: Router
  ) {}

  ngOnInit() {
    this.loadSubmissions();
    this.searchInput$
      .pipe(
        debounceTime(300),
        distinctUntilChanged(),
        takeUntil(this.destroy$)
      )
      .subscribe(query => {
        if (query.trim()) {
          this.performSearch(query);
        } else {
          this.filteredSubmissions = [...this.submissions];
        }
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadSubmissions() {
    this.isLoading = true;
    this.checklistService.getAllSubmissionList().subscribe({
      next: (data) => {
        this.submissions = data || [];
        this.filteredSubmissions = [...this.submissions];
        this.isLoading = false;
      },
      error: () => {
        this.submissions = [];
        this.filteredSubmissions = [];
        this.isLoading = false;
      }
    });
  }

  onSearch() {
    this.searchInput$.next(this.searchQuery);
  }

  performSearch(query: string) {
    this.isLoading = true;
    this.checklistService.getAllSubmissionList({ search: query }).subscribe({
      next: (data) => {
        this.filteredSubmissions = data || [];
        this.isLoading = false;
      },
      error: () => {
        this.filteredSubmissions = [];
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

  getStatusClass(status: string): string {
    switch (status) {
      case 'Submitted':
        return 'badge-green';
      case 'Reviewed':
        return 'badge-blue';
      default:
        return 'badge-gray';
    }
  }

  openSubmission(id: number) {
    this.router.navigate(['/dashboard/admin/submissions', id]);
  }

  trackById(index: number, item: SubmissionListItem): number {
    return item.id;
  }
}
