import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { ResourceService } from '../../../core/resource.service';
import { ChecklistService, ChecklistDetail as ChecklistDetailDto } from '../../../Shared/services/checklist.service';
import { ToastService } from '../../../Shared/services/toast.service';

@Component({
  selector: 'app-checklist-detail',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './checklist-detail.html',
  styleUrl: './checklist-detail.css'
})
export class ChecklistDetailPage implements OnInit {
  checklistId: number = 0;
  checklist?: ChecklistDetailDto;
  tab: 'overview' | 'questions' | 'units' | 'history' = 'overview';
  showAssign = false;

  clients: any[] = [];
  projects: any[] = [];
  units: any[] = [];

  selectedClientId: string | number = '';
  selectedProjectId: string | number = '';
  selectedUnitId: string | number = '';

  loading = false;
  assignLoading = false;

  private route = inject(ActivatedRoute);
  private resource = inject(ResourceService);
  private checklistService = inject(ChecklistService);
  private toast = inject(ToastService);

  ngOnInit(): void {
    this.checklistId = Number(this.route.snapshot.paramMap.get('id'));
    this.loadChecklistDetail();
    this.loadClients();
  }

  loadChecklistDetail(): void {
    this.loading = true;
    this.checklistService.getChecklistDetail(this.checklistId).subscribe({
      next: (data) => {
        this.checklist = data;
        this.loading = false;
      },
      error: () => {
        this.toast.show('Failed to load checklist details', 'error');
        this.loading = false;
      }
    });
  }

  loadClients(): void {
    this.resource.getAll('Clients').subscribe({
      next: (data) => {
        this.clients = data || [];
      },
      error: () => {
        this.clients = [];
      }
    });
  }

  onClientChange(): void {
    this.selectedProjectId = '';
    this.selectedUnitId = '';
    this.projects = [];
    this.units = [];
    if (!this.selectedClientId) return;
    this.resource.getAll('Projects', { clientId: this.selectedClientId }).subscribe({
      next: (data) => {
        this.projects = data || [];
      },
      error: () => {
        this.projects = [];
      }
    });
  }

  onProjectChange(): void {
    this.selectedUnitId = '';
    this.units = [];
    if (!this.selectedProjectId) return;
    this.resource.getAll('Units', { projectId: this.selectedProjectId }).subscribe({
      next: (data) => {
        this.units = data || [];
      },
      error: () => {
        this.units = [];
      }
    });
  }

  openAssignModal(): void {
    this.showAssign = true;
    this.selectedClientId = '';
    this.selectedProjectId = '';
    this.selectedUnitId = '';
    this.projects = [];
    this.units = [];
  }

  closeAssignModal(): void {
    this.showAssign = false;
  }

  assignUnit(): void {
    if (!this.selectedUnitId || !this.checklist) {
      this.toast.show('Please select a unit', 'error');
      return;
    }
    this.assignLoading = true;
    this.checklistService.assignUnitToChecklist({
      checklistId: this.checklistId,
      unitId: Number(this.selectedUnitId),
      frequency: this.checklist.frequency
    }).subscribe({
      next: () => {
        this.toast.show('Unit assigned successfully!', 'success');
        this.showAssign = false;
        this.assignLoading = false;
        this.tab = 'units';
        this.loadChecklistDetail();
      },
      error: () => {
        this.toast.show('Failed to assign unit', 'error');
        this.assignLoading = false;
      }
    });
  }

  removeUnit(unitChecklistId: number): void {
    this.checklistService.removeUnitFromChecklist(unitChecklistId).subscribe({
      next: () => {
        this.toast.show('Unit removed successfully!', 'success');
        this.loadChecklistDetail();
      },
      error: () => {
        this.toast.show('Failed to remove unit', 'error');
      }
    });
  }

  requiredPhotos(): number {
    return this.checklist?.questions?.filter(q => q.requirePhoto).length ?? 0;
  }

  requiredNotes(): number {
    return this.checklist?.questions?.filter(q => q.requireNotes).length ?? 0;
  }

 getQuestionType(q: any): string {
  if (q.requireNumeric) return 'Numeric';
  if (q.requireTextValue) return 'Text';
  return 'Pass / Fail / N/A';
}

  setTab(tab: 'overview' | 'questions' | 'units' | 'history'): void {
    this.tab = tab;
  }
}
