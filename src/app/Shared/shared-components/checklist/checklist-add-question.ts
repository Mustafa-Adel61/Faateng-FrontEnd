import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute, RouterModule } from '@angular/router';
import { ChecklistService, ChecklistQuestion } from '../../services/checklist.service';
import { AuthService } from '../../../core/auth';
import { ToastService } from '../../services/toast.service';

@Component({
  selector: 'app-checklist-add-question',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './checklist-add-question.html',
  styleUrls: ['./checklist-add-question.css']
})
export class ChecklistAddQuestion implements OnInit {
  role: string | null = null;
  
  isEditing: boolean = false;
  editingId: number | null = null;

  question: any = {
    systemType: '',
    variant: '',
    frequency: '',
    category: 'General & IAQ',
    textEn: '',
    textAr: '',
    requirePhoto: false,
    requireNotes: false,
    requireNumeric: false
  };

  allQuestions: ChecklistQuestion[] = [];
  paginatedQuestions: ChecklistQuestion[] = [];
  currentPage: number = 1;
  pageSize: number = 5;
  totalQuestions: number = 0;

  systems = [
    { name: 'Elevator', variants: ['AC Gearless', 'AC Geared'] },
    { name: 'Escalator', variants: ['Standard'] },
    { name: 'Moving Walk', variants: ['Standard'] },
    { name: 'AHU', variants: ['Standard'] },
    { name: 'FCU', variants: ['Standard'] },
    { name: 'VRF / DX', variants: ['Standard'] },
    { name: 'Chiller', variants: ['Standard'] },
    { name: 'Cooling Tower', variants: ['Standard'] },
    { name: 'Pump', variants: ['Standard'] },
    { name: 'Exhaust/Supply Fan', variants: ['Standard'] },
    { name: 'Package / Rooftop Unit', variants: ['Standard'] }
  ];

  frequencies = ['Monthly', 'Quarterly', 'Annual'];
  categories = ['General & IAQ', 'Mechanical', 'Electrical', 'Safety', 'Others'];

  constructor(
    private checklistService: ChecklistService,
    private auth: AuthService,
    private router: Router,
    private toast: ToastService
  ) {}

  protected readonly Math = Math;

  ngOnInit() {
    this.role = this.auth.getRole();
    this.loadAllQuestions();
  }

  loadAllQuestions() {
    this.checklistService.getQuestions().subscribe(res => {
      this.allQuestions = res;
      this.totalQuestions = res.length;
      this.updatePagination();
    });
  }

  updatePagination() {
    const startIndex = (this.currentPage - 1) * this.pageSize;
    this.paginatedQuestions = this.allQuestions.slice(startIndex, startIndex + this.pageSize);
  }

  nextPage() {
    if (this.currentPage * this.pageSize < this.totalQuestions) {
      this.currentPage++;
      this.updatePagination();
    }
  }

  prevPage() {
    if (this.currentPage > 1) {
      this.currentPage--;
      this.updatePagination();
    }
  }

  onSystemChange() {
    const sys = this.systems.find(s => s.name === this.question.systemType);
    if (sys && sys.variants.length === 1) {
      this.question.variant = sys.variants[0];
    } else {
      this.question.variant = '';
    }
  }

  isValid() {
    return this.question.systemType && 
           this.question.frequency && 
           this.question.textEn && 
           this.question.textAr &&
           (this.question.systemType !== 'Elevator' || this.question.variant);
  }

  save() {
    if (this.isEditing && this.editingId) {
      this.checklistService.updateQuestion(this.editingId, this.question).subscribe(() => {
        this.toast.show('Question updated successfully', 'success');
        this.resetForm();
        this.loadAllQuestions();
      });
    } else {
      this.checklistService.createQuestion(this.question).subscribe(() => {
        this.toast.show('Question added successfully', 'success');
        this.resetForm();
        this.loadAllQuestions();
      });
    }
  }

  editQuestion(q: ChecklistQuestion) {
    this.isEditing = true;
    this.editingId = q.id!;
    this.question = { ...q };
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  deleteQuestion(id: number) {
    if (confirm('Are you sure you want to delete this question?')) {
      this.checklistService.deleteQuestion(id).subscribe(() => {
        this.toast.show('Question deleted successfully', 'success');
        this.loadAllQuestions();
      });
    }
  }

  resetForm() {
    this.isEditing = false;
    this.editingId = null;
    this.question = {
      systemType: '',
      variant: '',
      frequency: '',
      category: 'General & IAQ',
      textEn: '',
      textAr: '',
      requirePhoto: false,
      requireNotes: false,
      requireNumeric: false
    };
  }

  getDashboardPath(): string {
    return `/dashboard/${this.role}`;
  }
}
