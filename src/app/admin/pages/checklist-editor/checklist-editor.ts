import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { ChecklistService, ChecklistStatus, CreateChecklist, UpdateChecklist, CreateChecklistQuestion } from '../../../Shared/services/checklist.service';
import { ToastService } from '../../../Shared/services/toast.service';

type QuestionType = 'Pass / Fail / N/A' | 'Numeric' | 'Text';

interface QuestionRow {
  id?: number;
  text: string;
  type: QuestionType;
  section: string;
  photoRequired: boolean;
  notesRequired: boolean;
}

@Component({
  selector: 'app-checklist-editor',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './checklist-editor.html',
  styleUrl: './checklist-editor.css'
})
export class ChecklistEditor implements OnInit {
  @Input() embedded = false;
  @Input() initialSystem = '';
  @Output() cancelled = new EventEmitter<void>();
  @Output() published = new EventEmitter<number>();

  id?: number;
  name = '';
  system = 'Elevator';
  category = 'Preventive Maintenance';
  frequency = 'Monthly';
  questions: QuestionRow[] = [];
  loading = false;
  saving = false;
  submitted = false;

  systems = [
    'Elevator', 'Chiller', 'HVAC', 'Fire Pump', 'Generator',
    'Escalator', 'Moving Walk', 'AHU', 'FCU', 'VRF / DX',
    'Cooling Tower', 'Pump', 'Exhaust/Supply Fan', 'Package / Rooftop Unit'
  ];
  categories = ['Preventive Maintenance', 'Corrective Maintenance', 'Commissioning', 'Safety Inspection'];
  frequencies = ['Daily', 'Weekly', 'Monthly', 'Quarterly', 'One Time'];
  questionTypes: QuestionType[] = ['Pass / Fail / N/A', 'Numeric', 'Text'];

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private checklistService: ChecklistService,
    private toast: ToastService
  ) {}

  ngOnInit(): void {
    if (this.initialSystem) {
      this.system = this.initialSystem;
    }
    const raw = this.route.snapshot.paramMap.get('id');
    if (raw) {
      this.id = Number(raw);
      this.loading = true;
      this.checklistService.getChecklistDetail(this.id).subscribe({
        next: (detail) => {
          this.name = detail.name;
          this.system = detail.system;
          this.category = detail.category;
          this.frequency = detail.frequency;
          this.questions = (detail.questions || []).map((q) => ({
  id: q.id,
  text: q.textEn || q.textAr || '',
  type: this.inferType(q),   // هيشتغل صح دلوقت لأن q فيها requireTextValue من الـ DTO
  section: q.section || '',
  photoRequired: q.requirePhoto,
  notesRequired: q.requireNotes
}));
        },
        error: () => {
          this.toast.show('Failed to load checklist', 'error');
        },
        complete: () => {
          this.loading = false;
        }
      });
    }
  }

private inferType(q: { requireNumeric: boolean; requireTextValue: boolean }): QuestionType {
  if (q.requireNumeric) return 'Numeric';
  if (q.requireTextValue) return 'Text';
  return 'Pass / Fail / N/A';
}
  addQuestion(): void {
    this.questions.push({
      id: undefined,
      text: '',
      type: 'Pass / Fail / N/A',
      section: '',
      photoRequired: false,
      notesRequired: false
    });
  }

  deleteQuestion(index: number): void {
    this.questions.splice(index, 1);
  }

  trackByIndex(index: number): number {
    return index;
  }

  save(status: ChecklistStatus): void {
    if (this.saving) return;
    this.submitted = true;
    if (!this.name.trim()) {
      this.toast.show('Please enter a checklist name', 'error');
      return;
    }
    if (this.questions.some(q => !q.text.trim())) {
      this.toast.show('Please complete every question', 'error');
      return;
    }
    const questionsDto: CreateChecklistQuestion[] = this.questions.map((q, i) => ({
      id: q.id ?? null,
      checklistId: this.id ?? null,
      section: q.section || 'General',
      order: i + 1,
      textEn: q.text,
      textAr: q.text,
      requirePhoto: q.photoRequired,
      requireNotes: q.notesRequired,
      requireNumeric: q.type === 'Numeric',
        requireTextValue: q.type === 'Text'   // ← ضيف السطر ده

    }));

    this.saving = true;
    if (this.id) {
      const dto: UpdateChecklist = {
        name: this.name,
        category: this.category,
        system: this.system,
        frequency: this.frequency,
        status,
        questions: questionsDto
      };
      this.checklistService.updateChecklist(this.id, dto).subscribe({
        next: () => {
          this.toast.show('Checklist updated successfully', 'success');
          if (this.embedded && this.id) {
            this.published.emit(this.id);
          } else {
            this.router.navigate(['/dashboard/admin/checklists', this.id]);
          }
        },
        error: () => {
          this.toast.show('Failed to update checklist', 'error');
          this.saving = false;
        }
      });
    } else {
      const dto: CreateChecklist = {
        name: this.name,
        category: this.category,
        system: this.system,
        frequency: this.frequency,
        status,
        questions: questionsDto
      };
      this.checklistService.createChecklist(dto).subscribe({
        next: (newId) => {
          this.toast.show('Checklist created successfully', 'success');
          if (this.embedded) {
            this.published.emit(Number(newId));
          } else {
            this.router.navigate(['/dashboard/admin/checklists', newId]);
          }
        },
        error: () => {
          this.toast.show('Failed to create checklist', 'error');
          this.saving = false;
        }
      });
    }
  }

  cancel(): void {
    if (this.embedded) {
      this.cancelled.emit();
    } else {
      this.router.navigate(['/dashboard/admin/checklists']);
    }
  }
}
