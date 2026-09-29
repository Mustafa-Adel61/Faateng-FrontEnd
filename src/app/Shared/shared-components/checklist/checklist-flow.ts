import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { ChecklistService, ChecklistQuestion, ChecklistAnswer } from '../../services/checklist.service';
import { AuthService } from '../../../core/auth';
import { ToastService } from '../../services/toast.service';
import { ResourceService } from '../../../core/resource.service';

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

  // ===== NEW: Checklist selection for Technician =====
  availableChecklists: any[] = []; // checklists assigned to this unit
  selectedChecklistId: number | null = null;
  selectedChecklist: any = null;
  loadingChecklists: boolean = false;
  
  // Language
  selectedLanguage: string = 'English';
  autoStartImmediately: boolean = false;
  
  // Questions
  questions: ChecklistQuestion[] = [];
  answers: any[] = [];
  currentPage: number = 0;
  questionsPerPage: number = 5;
  
  // Header data
  site: string = '';
  unitId: string = '';
  unitName: string = '';
  technician: string = '';
  date: string = new Date().toISOString().split('T')[0];
  taskId: number | null = null;
  isReadOnly: boolean = false;
  isEditMode: boolean = false;
  existingSubmissionId: number | null = null;

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
    private route: ActivatedRoute,
    private toast: ToastService,
    private resource: ResourceService
  ) {}

ngOnInit() {
  this.role = this.auth.getRole();
  this.isAdmin = this.role === 'admin' || this.role === 'manager';

  this.route.queryParams.subscribe(params => {
    if (params['taskId']) {
      this.taskId = Number(params['taskId']);
    }

    if (params['site'] && params['unitId']) {
      this.site = params['site'];
      this.unitId = params['unitId'];
      this.unitName = params['unitName'] || '';
      this.technician = params['technician'];
      this.isReadOnly = true;
      this.step = 3;

      this.initTechnicianFlow();   // بدل النداء المباشر لـ startChecklist()
    }
  });
}

private initTechnicianFlow() {
  if (this.taskId) {
    // بنبعت الـ unitId عشان التاسك الواحدة ممكن يكون فيها أكتر من unit
    this.checklistService.getSubmissionByTaskId(this.taskId, this.unitId).subscribe({
      next: (submission) => submission
        ? this.loadExistingSubmission(submission)
        : this.loadAssignedChecklists(),
      error: () => this.loadAssignedChecklists()
    });
  } else {
    this.loadAssignedChecklists();
  }
}

private loadExistingSubmission(submission: any) {
  this.isEditMode = true;
  this.existingSubmissionId = submission.id;
  this.selectedLanguage = submission.language;
  if (submission.checklistId) {
    this.selectedChecklistId = submission.checklistId;
    this.selectedChecklist = { id: submission.checklistId, name: submission.checklistName };
  }
  this.loadQuestions(submission.answers);
}

  // ===== NEW: Load checklists assigned to the given unit =====
  loadAssignedChecklists() {
    console.log('SASASASAASALoading assigned checklists for unitId:', this.unitId);
    // If we only have the unitId as a string like "PRJ-ELV-001", we need the numeric DB id.
    // Try to fetch by unit id - the API expects numeric id.
    const numericUnitId = parseInt(this.unitId, 10);
    if (!isNaN(numericUnitId)) {
      this.loadingChecklists = true;
      this.checklistService.getChecklistsForUnit(numericUnitId).subscribe({
        next: (lists) => {
          this.availableChecklists = lists || [];
          this.loadingChecklists = false;
          if (this.availableChecklists.length === 1) {
            this.selectChecklist(this.availableChecklists[0]);
            if (this.autoStartImmediately) {
              this.startChecklist();
            }
          }
        },
        error: (err) => {
          console.warn('Could not load assigned checklists for unit, falling back to legacy', err);
          this.loadingChecklists = false;
        }
      });
    }
  }

  // ===== NEW: Technician selects a checklist =====
  selectChecklist(cl: any) {
    this.selectedChecklist = cl;
    this.selectedChecklistId = cl.id;
    // Prefill legacy fields from checklist for backward compat
    this.selectedSystem = cl.system || this.selectedSystem;
    this.selectedFrequency = cl.frequency || this.selectedFrequency;

    if (this.isReadOnly) {
      this.startChecklist();
    }
  }

canGoFromChecklistToLanguage() {
  if (this.availableChecklists.length > 0) {
    return !!this.selectedChecklistId;
  }
  // Legacy admin-only path (لو لسه محتاجينه لإدارة الأسئلة القديمة)
  return this.selectedSystem && this.selectedFrequency &&
    (this.selectedSystem !== 'Elevator' || this.selectedVariant);
}

  checkExistingSubmission() {
    if (!this.taskId) return;
    this.checklistService.getSubmissionByTaskId(this.taskId, this.unitId).subscribe({
      next: (submission) => {
        if (submission) {
          this.isEditMode = true;
          this.existingSubmissionId = submission.id!;
          this.site = submission.site;
          this.unitId = submission.unitId;
          this.unitName = (submission as any).unitName || this.unitName;
          this.technician = submission.technicianName;
          this.selectedSystem = submission.systemType;
          this.selectedFrequency = submission.frequency;
          this.selectedLanguage = submission.language;

          // If the submission has a checklist id, set it
          const anySub: any = submission;
          if (anySub.checklistId) {
            this.selectedChecklistId = anySub.checklistId;
            this.selectedChecklist = { id: anySub.checklistId, name: anySub.checklistName };
          }
          
          this.loadQuestions(submission.answers);
          this.step = 3; // Go straight to questions if editing
        }
      },
      error: () => {
        // No existing submission, proceed as normal
      }
    });
  }

 loadQuestions(existingAnswers?: any[]) {
  // ===== الاعتماد بقى على checklistId فقط، مفيش legacy fallback خالص =====
  if (!this.selectedChecklistId) {
    console.warn('loadQuestions called without a selectedChecklistId — aborting');
    return;
  }

  const params: any = { checklistId: this.selectedChecklistId };

  this.checklistService.getQuestions(params)
    .subscribe(res => {
      this.questions = res;
      if (existingAnswers) {
        this.answers = res.map(q => {
          const existing = existingAnswers.find(a => a.questionId === q.id);
          return {
            questionId: q.id,
            status: existing ? existing.status : '',
            notes: existing ? existing.notes : '',
            photoUrl: existing ? existing.photoUrl : '',
            photoFile: null,
            numericValue: existing ? existing.numericValue : null,
            textValue: existing ? existing.value : '',
            isDirty: false
          };
        });
      } else {
        this.answers = res.map(q => ({
          questionId: q.id,
          status: '',
          notes: '',
          photoUrl: '',
          photoFile: null,
          numericValue: null,
          textValue: '',
          isDirty: false
        }));
      }
      this.step = 3;
    });
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
    this.selectedChecklistId = null;
    this.selectedChecklist = null;
    this.availableChecklists = [];
    this.step = 1;
  }

  goBack() {
    if (this.step === 3) {
      // From questions back to step 2
      this.step = 2;
      this.currentPage = 0;
    } else if (this.taskId && this.isReadOnly && this.step <= 2) {
      // Return to task list without opening details
      const role = this.auth.getRole();
      this.router.navigate([`/dashboard/${role}/task-list`]);
    } else {
      this.step = 1;
    }
  }

  canGoToLanguage() {
    // ===== NEW: delegate to checklist-aware check =====
    return this.canGoFromChecklistToLanguage();
  }

  goToLanguage() {
    // In technician mode step 2 is already "checklist selection", so we skip to questions directly
    // We'll just move to questions directly from here since language is preselected.
    // But we also need to respect the "change language" option, so go to step 2 if in legacy mode.
    if (this.isReadOnly && this.availableChecklists.length > 0) {
      // Technician mode - go directly to start checklist (skip language selection screen)
      this.startChecklist();
    } else {
      this.step = 2;
    }
  }

  selectLanguage(lang: string) {
    this.selectedLanguage = lang;
  }

  startChecklist() {
    this.loadQuestions();
  }

  get paginatedQuestions() {
    const start = this.currentPage * this.questionsPerPage;
    return this.questions.slice(start, start + this.questionsPerPage);
  }

  get totalPages() {
    return Math.ceil(this.questions.length / this.questionsPerPage);
  }

  private getAnswerValueField(question: ChecklistQuestion): 'status' | 'numericValue' | 'textValue' {
    if (question.requireNumeric) return 'numericValue';
    if (question.requireNotes && !question.requireNumeric) return 'textValue';
    return 'status';
  }

  isQuestionInvalid(questionIndex: number): boolean {
  const q = this.questions[questionIndex] as any;
  const a = this.answers[questionIndex];

  if (!q || !a) return false;

  const missingStatus = !a.status && !q.requireNumeric && !q.requireTextValue;
  const missingNumeric = q.requireNumeric && (a.numericValue === null || a.numericValue === undefined || a.numericValue === '');
  const missingText = q.requireTextValue && (!a.textValue || !String(a.textValue).trim());
  const missingNotes = q.requireNotes && (!a.notes || !String(a.notes).trim());
  const missingPhoto = q.requirePhoto && !a.photoUrl && !a.photoFile;

  return missingStatus || missingNumeric || missingText || missingNotes || missingPhoto;
}

  isCurrentPageValid() {
    const start = this.currentPage * this.questionsPerPage;
    const end = start + this.questionsPerPage;

    for (let i = start; i < Math.min(end, this.answers.length); i++) {
      if (this.isQuestionInvalid(i)) return false;
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

    const submission: any = {
      site: this.site,
      unitId: this.unitId,
      unitName: this.unitName || this.unitId,
      technicianName: this.technician,
      systemType: this.selectedSystem,
      frequency: this.selectedFrequency,
      language: this.selectedLanguage,
      taskId: this.taskId,
      // ===== NEW: include checklist information =====
      checklistId: this.selectedChecklistId ?? undefined,
      checklistName: this.selectedChecklist?.name ?? undefined,
      answers: this.answers.map(a => ({
        questionId: a.questionId,
        status: a.status,
        notes: a.notes,
        photoUrl: a.photoUrl,
        value: a.textValue || (a.numericValue != null ? String(a.numericValue) : undefined),
        numericValue: a.numericValue != null ? Number(a.numericValue) : undefined
      }))
    };

    this.checklistService.submitChecklist(submission).subscribe({
      next: () => {
        this.toast.show('Checklist submitted successfully', 'success');
        this.isSubmitting = false;
        
        if (this.taskId && this.isReadOnly) {
          // Update task notes to mark checklist as done then return to technician task list
          this.resource.update('Tasks', this.taskId, { notes: 'CHECKLIST_DONE' }).subscribe({
            next: () => this.router.navigate(['/dashboard/technician/task-list']),
            error: () => this.router.navigate(['/dashboard/technician/task-list'])
          });
        } else {
          this.resetSelection();
        }
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

    const newQ = {
      systemType: this.selectedSystem,
      variant: this.selectedVariant,
      frequency: this.selectedFrequency,
      category: this.newQuestionCategory,
      section: 'General',
      order: 0,
      textEn: this.selectedLanguage === 'English' ? this.newQuestionText : '',
      textAr: this.selectedLanguage === 'Arabic' ? this.newQuestionText : '',
      requirePhoto: false,
      requireNotes: true,
      requireNumeric: false,
     requireTextValue: false   // ← ضيف السطر ده
    };

    this.checklistService.createQuestion(newQ).subscribe({
      next: () => {
        this.newQuestionText = '';
        this.toast.show('Question created successfully', 'success');
        this.loadQuestions();
      },
      error: () => this.toast.show('Failed to create question', 'error')
    });
  }

  deleteQuestion(id: number) {
    if (confirm('Are you sure you want to delete this question?')) {
      this.checklistService.deleteQuestion(id).subscribe({
        next: () => {
          this.toast.show('Question deleted successfully', 'success');
          this.loadQuestions();
        },
        error: () => this.toast.show('Failed to delete question', 'error')
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

    const updatedQ = {
      systemType: this.selectedSystem,
      variant: this.selectedVariant,
      frequency: this.selectedFrequency,
      category: this.newQuestionCategory,
      section: 'General',
      order: 0,
      textEn: this.selectedLanguage === 'English' ? this.newQuestionText : '',
      textAr: this.selectedLanguage === 'Arabic' ? this.newQuestionText : '',
      requirePhoto: false,
      requireNotes: true,
      requireNumeric: false,
      requireTextValue: false
    };

    this.checklistService.updateQuestion(this.editingQuestionId, updatedQ).subscribe({
      next: () => {
        this.editingQuestionId = null;
        this.newQuestionText = '';
        this.toast.show('Question updated successfully', 'success');
        this.loadQuestions();
      },
      error: () => this.toast.show('Failed to update question', 'error')
    });
  }
}
