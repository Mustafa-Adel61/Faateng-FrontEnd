import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_BASE_URL } from '../../core/api.config';

// ============ Question Types ============
export type QuestionType = 'Pass / Fail / N/A' | 'Numeric' | 'Text';

export interface ChecklistQuestion {
  id?: number;
  checklistId?: number | null;
  systemType: string;
  variant?: string;
  frequency: string;
  category: string;
  section: string;
  order: number;
  textEn: string;
  textAr: string;
  requirePhoto: boolean;
  requireNotes: boolean;
  requireNumeric: boolean;
  requireTextValue: boolean;
}

export interface CreateChecklistQuestion {
  id?: number | null;
  checklistId?: number | null;
  systemType?: string;
  variant?: string;
  frequency?: string;
  category?: string;
  section?: string;
  order?: number;
  textEn: string;
  textAr: string;
  requirePhoto: boolean;
  requireNotes: boolean;
  requireNumeric: boolean;
    requireTextValue: boolean;  // ← ضيفها لو مش موجودة

}

// ============ Checklist Template Types ============
export type ChecklistStatus = 'Draft' | 'Published';

export interface Checklist {
  id: number;
  name: string;
  category: string;
  system: string;
  frequency: string;
  status: ChecklistStatus;
  createdDate: string;
  updatedDate: string;
  questionsCount: number;
  linkedUnitsCount: number;
  requiredPhotosCount: number;
  requiredNotesCount: number;
}

export interface ChecklistDetail {
  id: number;
  name: string;
  category: string;
  system: string;
  frequency: string;
  status: ChecklistStatus;
  createdDate: string;
  updatedDate: string;
  questions: ChecklistQuestion[];
  units: UnitChecklistLink[];
  history: ChecklistHistoryItem[];
}

export interface CreateChecklist {
  name: string;
  category: string;
  system: string;
  frequency: string;
  status: ChecklistStatus;
  questions: CreateChecklistQuestion[];
}

export interface UpdateChecklist {
  name: string;
  category: string;
  system: string;
  frequency: string;
  status: ChecklistStatus;
  questions: CreateChecklistQuestion[];
}

// ============ Unit Link Types ============
export interface UnitChecklistLink {
  id: number;
  checklistId: number;
  unitId: number;
  unitName: string;
  unitModel: string;
  unitType: string;
  projectId?: number;
  projectName: string;
  clientId?: string;
  clientName: string;
  frequency: string;
  assignedDate: string;
}

export interface AssignUnitChecklist {
  checklistId: number;
  unitId: number;
  frequency?: string;
}

// ============ History Types ============
export interface ChecklistHistoryItem {
  id: number;
  checklistId: number;
  action: string;
  userName: string;
  date: string;
}

// ============ Answer Types ============
export interface ChecklistAnswer {
  questionId: number;
  questionTextEn?: string;
  questionTextAr?: string;
  category?: string;
  section?: string;
  status: string;
  value?: string;
  notes?: string;
  photoUrl?: string;
  numericValue?: number;
}

export interface CreateChecklistAnswer {
  questionId: number;
  status: string;
  value?: string;
  notes?: string;
  photoUrl?: string;
  numericValue?: number;
}

// ============ Submission Types ============
export type SubmissionStatus = 'Submitted' | 'Reviewed';

export interface SubmissionListItem {
  id: number;
  checklistId?: number;
  checklistName: string;
  site: string;
  unitId: string;
  unitName: string;
  technicianName: string;
  date: string;
  frequency: string;
  status: SubmissionStatus;
  passedCount: number;
  failedCount: number;
  scorePercentage?: number;
}

export interface ChecklistSubmissionDetail {
  id: number;
  checklistId?: number;
  checklistName: string;
  site: string;
  unitId: string;
  unitName: string;
  technicianName: string;
  date: string;
  systemType: string;
  frequency: string;
  language: string;
  status: SubmissionStatus;
  taskId?: number;
  clientName?: string;
  passedCount: number;
  failedCount: number;
  notApplicableCount: number;
  scorePercentage?: number;
  answers: ChecklistAnswer[];
}

export interface CreateChecklistSubmission {
  checklistId?: number;
  checklistName?: string;
  site: string;
  unitId: string;
  unitName?: string;
  technicianName: string;
  systemType: string;
  frequency: string;
  language: string;
  taskId?: number;
  answers: CreateChecklistAnswer[];
}

// Old compatibility types (keep for legacy flow)
export interface ChecklistSubmissionCompat {
  id?: number;
  site: string;
  unitId: string;
  technicianName: string;
  date?: string;
  systemType: string;
  frequency: string;
  language: string;
  taskId?: number;
  clientName?: string;
  answers: ChecklistAnswer[];
}

@Injectable({
  providedIn: 'root'
})
export class ChecklistService {
  private apiUrl = `${API_BASE_URL}/Checklist`;

  constructor(private http: HttpClient) {}

  // ==================== CHECKLIST TEMPLATES ====================
  getAllChecklists(params?: { status?: string; system?: string; search?: string }): Observable<Checklist[]> {
    let httpParams = new HttpParams();
    if (params?.status) httpParams = httpParams.set('status', params.status);
    if (params?.system) httpParams = httpParams.set('system', params.system);
    if (params?.search) httpParams = httpParams.set('search', params.search);
    return this.http.get<Checklist[]>(this.apiUrl, { params: httpParams });
  }

  getChecklistDetail(id: number): Observable<ChecklistDetail> {
    return this.http.get<ChecklistDetail>(`${this.apiUrl}/${id}`);
  }

  createChecklist(dto: CreateChecklist): Observable<number> {
    return this.http.post<number>(this.apiUrl, dto);
  }

  updateChecklist(id: number, dto: UpdateChecklist): Observable<any> {
    return this.http.put(`${this.apiUrl}/${id}`, dto);
  }

  deleteChecklist(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`);
  }

  // ==================== QUESTIONS ====================
  getQuestions(params?: { systemType?: string; variant?: string; frequency?: string; checklistId?: number }): Observable<ChecklistQuestion[]> {
    let httpParams = new HttpParams();
    if (params?.systemType) httpParams = httpParams.set('systemType', params.systemType);
    if (params?.variant) httpParams = httpParams.set('variant', params.variant);
    if (params?.frequency) httpParams = httpParams.set('frequency', params.frequency);
    if (params?.checklistId) httpParams = httpParams.set('checklistId', params.checklistId.toString());
    return this.http.get<ChecklistQuestion[]>(`${this.apiUrl}/questions`, { params: httpParams });
  }

  createQuestion(question: CreateChecklistQuestion): Observable<ChecklistQuestion> {
    return this.http.post<ChecklistQuestion>(`${this.apiUrl}/questions`, question);
  }

  updateQuestion(id: number, question: CreateChecklistQuestion): Observable<any> {
    return this.http.put(`${this.apiUrl}/questions/${id}`, question);
  }

  deleteQuestion(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/questions/${id}`);
  }

  // ==================== UNIT LINKING ====================
  assignUnitToChecklist(dto: AssignUnitChecklist): Observable<any> {
    return this.http.post(`${this.apiUrl}/assign-unit`, dto);
  }

  removeUnitFromChecklist(unitChecklistId: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/remove-unit/${unitChecklistId}`);
  }

  getChecklistsForUnit(unitId: number): Observable<Checklist[]> {
    return this.http.get<Checklist[]>(`${this.apiUrl}/unit/${unitId}/checklists`);
  }

  // ==================== SUBMISSIONS ====================
  submitChecklist(submission: CreateChecklistSubmission | any): Observable<number> {
    return this.http.post<number>(`${this.apiUrl}/submissions`, submission);
  }

  getAllSubmissionList(params?: { search?: string; status?: string; checklistId?: number; unitId?: string }): Observable<SubmissionListItem[]> {
    let httpParams = new HttpParams();
    if (params?.search) httpParams = httpParams.set('search', params.search);
    if (params?.status) httpParams = httpParams.set('status', params.status);
    if (params?.checklistId) httpParams = httpParams.set('checklistId', params.checklistId.toString());
    if (params?.unitId) httpParams = httpParams.set('unitId', params.unitId);
    return this.http.get<SubmissionListItem[]>(`${this.apiUrl}/submissions`, { params: httpParams });
  }

  getSubmissionDetails(id: number): Observable<ChecklistSubmissionDetail> {
    return this.http.get<ChecklistSubmissionDetail>(`${this.apiUrl}/submissions/${id}`);
  }

  getSubmissionByTaskId(taskId: number, unitId?: string | number | null): Observable<ChecklistSubmissionDetail> {
    let httpParams = new HttpParams();
    if (unitId != null && unitId !== '') httpParams = httpParams.set('unitId', String(unitId));
    return this.http.get<ChecklistSubmissionDetail>(`${this.apiUrl}/submissions/task/${taskId}`, { params: httpParams });
  }

  // كل الـ submissions المرتبطة بتاسك معينة (للعرض في اختيار الوحدة)
  getSubmissionsForTask(taskId: number): Observable<SubmissionListItem[]> {
    return this.http.get<SubmissionListItem[]>(`${this.apiUrl}/submissions/task/${taskId}/list`);
  }

  markSubmissionReviewed(id: number): Observable<any> {
    return this.http.put(`${this.apiUrl}/submissions/${id}/review`, {});
  }

  // --- Legacy compatibility wrappers ---
  getAllSubmissions(): Observable<SubmissionListItem[]> {
    return this.getAllSubmissionList();
  }
}
