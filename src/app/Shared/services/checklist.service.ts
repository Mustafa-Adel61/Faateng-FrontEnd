import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_BASE_URL } from '../../core/api.config';

export interface ChecklistQuestion {
  id?: number;
  systemType: string;
  variant?: string;
  frequency: string;
  category: string;
  textEn: string;
  textAr: string;
  requirePhoto: boolean;
  requireNotes: boolean;
  requireNumeric: boolean;
}

export interface ChecklistSubmission {
  id?: number;
  site: string;
  unitId: string;
  technicianName: string;
  date: string;
  systemType: string;
  frequency: string;
  language: string;
  clientName?: string;
  answers: ChecklistAnswer[];
}

export interface ChecklistAnswer {
  questionId: number;
  questionTextEn?: string;
  questionTextAr?: string;
  category?: string;
  status: string;
  notes?: string;
  photoUrl?: string;
  numericValue?: number;
}

@Injectable({
  providedIn: 'root'
})
export class ChecklistService {
  private apiUrl = `${API_BASE_URL}/Checklist`;

  constructor(private http: HttpClient) {}

  // Questions
  getQuestions(systemType?: string, variant?: string, frequency?: string): Observable<ChecklistQuestion[]> {
    let params: any = {};
    if (systemType) params.systemType = systemType;
    if (variant) params.variant = variant;
    if (frequency) params.frequency = frequency;
    return this.http.get<ChecklistQuestion[]>(`${this.apiUrl}/questions`, { params });
  }

  createQuestion(question: ChecklistQuestion): Observable<ChecklistQuestion> {
    return this.http.post<ChecklistQuestion>(`${this.apiUrl}/questions`, question);
  }

  updateQuestion(id: number, question: ChecklistQuestion): Observable<any> {
    return this.http.put(`${this.apiUrl}/questions/${id}`, question);
  }

  deleteQuestion(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/questions/${id}`);
  }

  // Submissions
  submitChecklist(submission: any): Observable<number> {
    return this.http.post<number>(`${this.apiUrl}/submissions`, submission);
  }

  getAllSubmissions(): Observable<ChecklistSubmission[]> {
    return this.http.get<ChecklistSubmission[]>(`${this.apiUrl}/submissions`);
  }

  getSubmissionDetails(id: number): Observable<ChecklistSubmission> {
    return this.http.get<ChecklistSubmission>(`${this.apiUrl}/submissions/${id}`);
  }
}
