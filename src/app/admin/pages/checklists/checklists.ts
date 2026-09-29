import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink, Router } from '@angular/router';
import { ChecklistService, Checklist } from '../../../Shared/services/checklist.service';
import { ToastService } from '../../../Shared/services/toast.service';

@Component({
  selector: 'app-checklists',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './checklists.html',
  styleUrls: ['./checklists.css']
})
export class Checklists implements OnInit {
  checklists: Checklist[] = [];
  filteredChecklists: Checklist[] = [];
  query: string = '';
  status: string = '';
  loading: boolean = false;
  showDeleteConfirm = false;
  checklistToDelete: Checklist | null = null;
  deletingChecklist = false;

  private checklistService = inject(ChecklistService);
  private toastService = inject(ToastService);
  private router = inject(Router);

  ngOnInit(): void {
    this.loadChecklists();
  }

  loadChecklists(): void {
    this.loading = true;
    this.checklistService.getAllChecklists().subscribe({
      next: (data) => {
        this.checklists = data || [];
        this.applyFilters();
        this.loading = false;
      },
      error: () => {
        this.toastService.show('Failed to load checklists', 'error');
        this.checklists = [];
        this.filteredChecklists = [];
        this.loading = false;
      }
    });
  }

  get totalCount(): number {
    return this.checklists.length;
  }

  get publishedCount(): number {
    return this.checklists.filter(c => c.status === 'Published').length;
  }

  get draftCount(): number {
    return this.checklists.filter(c => c.status === 'Draft').length;
  }

  get linkedUnitsCount(): number {
    return this.checklists.reduce((sum, c) => sum + (c.linkedUnitsCount || 0), 0);
  }

  applyFilters(): void {
    const q = this.query.toLowerCase().trim();
    this.filteredChecklists = this.checklists.filter(c => {
      const matchesStatus = !this.status || c.status === this.status;
      const matchesQuery = !q ||
        `${c.name} ${c.system} ${c.category}`.toLowerCase().includes(q);
      return matchesStatus && matchesQuery;
    });
  }

  onSearchChange(): void {
    this.applyFilters();
  }

  onStatusChange(): void {
    this.applyFilters();
  }

  openChecklist(id: number): void {
    this.router.navigate(['/dashboard/admin/checklists', id]);
  }

  requestDeleteChecklist(checklist: Checklist): void {
    this.checklistToDelete = checklist;
    this.showDeleteConfirm = true;
  }

  cancelDelete(): void {
    this.showDeleteConfirm = false;
    this.checklistToDelete = null;
  }

  confirmDeleteChecklist(): void {
    if (!this.checklistToDelete || this.deletingChecklist) return;

    this.deletingChecklist = true;
    this.checklistService.deleteChecklist(this.checklistToDelete.id).subscribe({
      next: () => {
        this.toastService.show('Checklist deleted successfully', 'success');
        this.showDeleteConfirm = false;
        this.checklistToDelete = null;
        this.deletingChecklist = false;
        this.loadChecklists();
      },
      error: () => {
        this.toastService.show('Failed to delete checklist', 'error');
        this.deletingChecklist = false;
      }
    });
  }

  formatDate(dateStr: string): string {
    if (!dateStr) return '-';
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return dateStr;
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }

  trackById(_index: number, item: Checklist): number {
    return item.id;
  }
}
