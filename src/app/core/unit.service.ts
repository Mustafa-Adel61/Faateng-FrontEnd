import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { API_BASE_URL } from './api.config';
import { Observable } from 'rxjs';

export interface Unit {
  id?: number;
  serial: string;
  model: string;
  type: string;
  price: number;
  quantity: number;
  photos?: string[]; // array مباشرة
}

@Injectable({
  providedIn: 'root'
})
export class UnitService {
  private apiUrl = `${API_BASE_URL}/units`;

  constructor(private http: HttpClient) { }

  getAll(): Observable<Unit[]> {
    return this.http.get<Unit[]>(this.apiUrl);
  }

  get(id: number): Observable<Unit> {
    return this.http.get<Unit>(`${this.apiUrl}/${id}`);
  }

  create(unit: any): Observable<Unit> {
    return this.http.post<Unit>(this.apiUrl, unit);
  }

  update(id: number, unit: Unit): Observable<Unit> {
    return this.http.put<Unit>(`${this.apiUrl}/${id}`, unit);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }


   getByProject(projectId: number): Observable<Unit[]> {
    return this.http.get<Unit[]>(`${API_BASE_URL}/Units?projectId=${projectId}`);
  }
}
