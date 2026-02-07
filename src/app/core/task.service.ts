import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { API_BASE_URL } from './api.config';
import { Observable } from 'rxjs';

export interface TaskItem {
  id: number;
  unitId: number;
  unit?: any;
  title: string;
  description?: string;
  status: string;
  priority: string;
  scheduledStart?: string;
  scheduledEnd?: string;
  assigneeUserId?: string;
  assigneeUser?: { id?: string; fullName?: string; email?: string };
  lat?: number;
  lng?: number;
  locationName?: string;
  team?: string;
  slaDue?: string;
  slaStatus?: string;
  notes?: string;
}

export interface CreateTaskDto {
  unitId: number;
  title: string;
  description?: string;
  scheduledStart?: string;
  scheduledEnd?: string;
  priority: string;
  lat?: number;
  lng?: number;
  assigneeUserId?: string;
  team?: string;
  slaDue?: string;
  slaStatus?: string;
  notes?: string;
  locationName?: string;
}

@Injectable({
  providedIn: 'root'
})
export class TaskService {

  constructor(private http: HttpClient) { }
  getAll(): Observable<TaskItem[]> {
    return this.http.get<TaskItem[]>(`${API_BASE_URL}/Tasks`);
  }

  create(dto: CreateTaskDto): Observable<TaskItem> {
    return this.http.post<TaskItem>(`${API_BASE_URL}/Tasks`, dto);
  }

  assign(id: number, assigneeUserId: string): Observable<TaskItem> {
    return this.http.put<TaskItem>(`${API_BASE_URL}/Tasks/${id}/assign`, `"${assigneeUserId}"`, {
      headers: { 'Content-Type': 'application/json' }
    });
  }

  updateStatus(id: number, status: string): Observable<TaskItem> {
    return this.http.put<TaskItem>(`${API_BASE_URL}/Tasks/${id}/status`, `"${status}"`, {
      headers: { 'Content-Type': 'application/json' }
    });
  }

  calendar(from: string, to: string): Observable<TaskItem[]> {
    const url = `${API_BASE_URL}/Tasks/calendar?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`;
    return this.http.get<TaskItem[]>(url);
  }

  map(minLat: number, maxLat: number, minLng: number, maxLng: number): Observable<TaskItem[]> {
    const url = `${API_BASE_URL}/Tasks/map?minLat=${minLat}&maxLat=${maxLat}&minLng=${minLng}&maxLng=${maxLng}`;
    return this.http.get<TaskItem[]>(url);
  }
}
