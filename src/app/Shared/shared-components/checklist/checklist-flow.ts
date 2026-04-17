import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ChecklistService, ChecklistQuestion, ChecklistAnswer } from '../../services/checklist.service';
import { AuthService } from '../../../core/auth';
import { ToastService } from '../../services/toast.service';

@Component({
  selector: 'app-checklist-flow',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './checklist-flow.html',
  styleUrls: ['./checklist-flow.css']
})
export class ChecklistFlow implements OnInit {
  step: number = 1;
  role: string | null = null;
  
  // Selection
  selectedSystem: string = '';
  selectedVariant: string = 'Standard';
  selectedFrequency: string = '';
  
  // Language
  selectedLanguage: string = 'English';
  
  // Questions
  questions: ChecklistQuestion[] = [];
  answers: any[] = [];
  currentPage: number = 0;
  questionsPerPage: number = 5;
  
  // Header data
  site: string = '';
  unitId: string = '';
  technician: string = '';
  date: string = new Date().toISOString().split('T')[0];

  isSubmitting: boolean = false;

  // Admin management
  isAdmin: boolean = false;
  editingQuestionId: number | null = null;
  newQuestionText: string = '';
  newQuestionCategory: string = 'General & IAQ';

  translations: any = {
    'English': {
      'site': 'Site',
      'unitId': 'Unit ID',
      'technician': 'Technician',
      'date': 'Date',
      'back': 'Back',
      'next': 'Next',
      'finish': 'Finish',
      'pass': 'Pass',
      'fail': 'Fail',
      'na': 'N/A',
      'summary': 'Summary',
      'passed': 'Passed',
      'failed': 'Failed',
      'suggestedRepairs': 'Suggested Repairs',
      'noFailures': 'No failures recorded.',
      'changeLanguage': 'Change Language',
      'changeSelection': 'Change Selection'
    },
    'Arabic': {
      'site': 'الموقع',
      'unitId': 'رقم الوحدة',
      'technician': 'الفني',
      'date': 'التاريخ',
      'back': 'رجوع',
      'next': 'التالي',
      'finish': 'إنهاء',
      'pass': 'ناجح',
      'fail': 'راسب',
      'na': 'غير متاح',
      'summary': 'ملخص',
      'passed': 'تم الاجتياز',
      'failed': 'فشل',
      'suggestedRepairs': 'الإصلاحات المقترحة',
      'noFailures': 'لم يتم تسجيل أي فشل.',
      'changeLanguage': 'تغيير اللغة',
      'changeSelection': 'تغيير الاختيار'
    }
  };

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

  constructor(
    private checklistService: ChecklistService,
    private auth: AuthService,
    private router: Router,
    private toast: ToastService
  ) {}

  ngOnInit() {
    this.role = this.auth.getRole();
    this.isAdmin = this.role === 'admin' || this.role === 'manager';
  }

  selectSystem(system: any) {
    this.selectedSystem = system.name;
    if (system.variants.length === 1) {
      this.selectedVariant = system.variants[0];
    } else {
      this.selectedVariant = ''; // Force user to choose variant if more than one
    }
  }

  selectFrequency(freq: string) {
    this.selectedFrequency = freq;
  }

  resetSelection() {
    this.selectedSystem = '';
    this.selectedVariant = 'Standard';
    this.selectedFrequency = '';
    this.step = 1;
  }

  canGoToLanguage() {
    return this.selectedSystem && this.selectedFrequency && (this.selectedSystem !== 'Elevator' || this.selectedVariant);
  }

  goToLanguage() {
    this.step = 2;
  }

  selectLanguage(lang: string) {
    this.selectedLanguage = lang;
  }

  startChecklist() {
    this.loadQuestions();
  }

  loadQuestions() {
    this.checklistService.getQuestions(this.selectedSystem, this.selectedVariant, this.selectedFrequency)
      .subscribe(res => {
        this.questions = res;
        this.answers = res.map(q => ({
          questionId: q.id,
          status: '',
          notes: '',
          photoUrl: '',
          photoFile: null,
          numericValue: null,
          isDirty: false // To track validation
        }));
        this.step = 3;
      });
  }

  get paginatedQuestions() {
    const start = this.currentPage * this.questionsPerPage;
    return this.questions.slice(start, start + this.questionsPerPage);
  }

  get totalPages() {
    return Math.ceil(this.questions.length / this.questionsPerPage);
  }

  isCurrentPageValid() {
    const start = this.currentPage * this.questionsPerPage;
    const end = start + this.questionsPerPage;
    const pageQuestions = this.questions.slice(start, end);
    const pageAnswers = this.answers.slice(start, end);

    for (let i = 0; i < pageQuestions.length; i++) {
      const q = pageQuestions[i];
      const a = pageAnswers[i];

      if (!a.status) return false;
      if (q.requireNumeric && (a.numericValue === null || a.numericValue === undefined)) return false;
      if (a.status === 'Fail' && q.requirePhoto && !a.photoUrl) return false;
    }
    return true;
  }

  nextPage() {
    // Mark all questions on current page as dirty for validation display
    const start = this.currentPage * this.questionsPerPage;
    const end = start + this.questionsPerPage;
    for (let i = start; i < Math.min(end, this.answers.length); i++) {
      this.answers[i].isDirty = true;
    }

    if (this.isCurrentPageValid()) {
      if (this.currentPage < this.totalPages - 1) {
        this.currentPage++;
        window.scrollTo(0, 0);
      } else {
        this.step = 4; // Summary
      }
    } else {
      this.toast.show('Please answer all required fields on this page.', 'error');
    }
  }

  prevPage() {
    if (this.currentPage > 0) {
      this.currentPage--;
    } else {
      this.step = 2;
    }
  }

  openFilePicker(index: number) {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = (event: Event) => {
      const target = event.target as HTMLInputElement;
      const files = target.files;
      if (!files || files.length === 0) return;

      const file = files[0];
      this.compressImage(file).then(compressedBase64 => {
        const answerIndex = this.currentPage * this.questionsPerPage + index;
        this.answers[answerIndex].photoUrl = compressedBase64;
        this.answers[answerIndex].photoFile = file;
      });
    };
    input.click();
  }

  compressImage(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event: any) => {
        const img = new Image();
        img.src = event.target.result;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const MAX_WIDTH = 800;
          const MAX_HEIGHT = 800;
          let width = img.width;
          let height = img.height;

          if (width > height) {
            if (width > MAX_WIDTH) {
              height *= MAX_WIDTH / width;
              width = MAX_WIDTH;
            }
          } else {
            if (height > MAX_HEIGHT) {
              width *= MAX_HEIGHT / height;
              height = MAX_HEIGHT;
            }
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx?.drawImage(img, 0, 0, width, height);
          
          // Compress to 0.7 quality
          const dataUrl = canvas.toDataURL('image/jpeg', 0.7);
          resolve(dataUrl);
        };
      };
      reader.onerror = error => reject(error);
    });
  }

  onFileSelected(event: any, index: number) {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e: any) => {
        this.answers[this.currentPage * this.questionsPerPage + index].photoUrl = e.target.result;
      };
      reader.readAsDataURL(file);
      this.answers[this.currentPage * this.questionsPerPage + index].photoFile = file;
    }
  }

  getSummary() {
    const passed = this.answers.filter(a => a.status === 'Pass').length;
    const failed = this.answers.filter(a => a.status === 'Fail').length;
    const na = this.answers.filter(a => a.status === 'N/A').length;
    return { passed, failed, na };
  }

  finish() {
    if (this.isSubmitting) return;
    this.isSubmitting = true;

    const submission = {
      site: this.site,
      unitId: this.unitId,
      technicianName: this.technician,
      systemType: this.selectedSystem,
      frequency: this.selectedFrequency,
      language: this.selectedLanguage,
      answers: this.answers.map(a => ({
        questionId: a.questionId,
        status: a.status,
        notes: a.notes,
        photoUrl: a.photoUrl
      }))
    };

    this.checklistService.submitChecklist(submission).subscribe({
      next: () => {
        this.toast.show('Checklist submitted successfully', 'success');
        this.isSubmitting = false;
        this.resetSelection();
      },
      error: () => {
        this.toast.show('Error submitting checklist', 'error');
        this.isSubmitting = false;
      }
    });
  }

  // Admin Management Actions
  addQuestion() {
    if (!this.newQuestionText) return;

    const newQ: ChecklistQuestion = {
      systemType: this.selectedSystem,
      variant: this.selectedVariant,
      frequency: this.selectedFrequency,
      category: this.newQuestionCategory,
      textEn: this.selectedLanguage === 'English' ? this.newQuestionText : '',
      textAr: this.selectedLanguage === 'Arabic' ? this.newQuestionText : '',
      requirePhoto: false,
      requireNotes: true,
      requireNumeric: false
    };

    this.checklistService.createQuestion(newQ).subscribe(() => {
      this.newQuestionText = '';
      this.loadQuestions();
    });
  }

  deleteQuestion(id: number) {
    if (confirm('Are you sure you want to delete this question?')) {
      this.checklistService.deleteQuestion(id).subscribe(() => {
        this.loadQuestions();
      });
    }
  }

  editQuestion(q: ChecklistQuestion) {
    this.editingQuestionId = q.id!;
    this.newQuestionText = this.selectedLanguage === 'Arabic' ? q.textAr : q.textEn;
    this.newQuestionCategory = q.category;
  }

  updateQuestion() {
    if (!this.editingQuestionId || !this.newQuestionText) return;

    const updatedQ: ChecklistQuestion = {
      systemType: this.selectedSystem,
      variant: this.selectedVariant,
      frequency: this.selectedFrequency,
      category: this.newQuestionCategory,
      textEn: this.selectedLanguage === 'English' ? this.newQuestionText : '',
      textAr: this.selectedLanguage === 'Arabic' ? this.newQuestionText : '',
      requirePhoto: false, // Default for now
      requireNotes: true,
      requireNumeric: false
    };

    this.checklistService.updateQuestion(this.editingQuestionId, updatedQ).subscribe(() => {
      this.editingQuestionId = null;
      this.newQuestionText = '';
      this.loadQuestions();
    });
  }
}
