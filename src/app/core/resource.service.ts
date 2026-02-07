import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_BASE_URL } from './api.config';

@Injectable({
  providedIn: 'root'
})
export class ResourceService {
  constructor(private http: HttpClient) { }

  getAll(resource: string, params?: Record<string, string | number | boolean | undefined>): Observable<any[]> {
    let httpParams = new HttpParams();
    if (params) {
      Object.entries(params).forEach(([k, v]) => {
        if (v !== undefined && v !== null) httpParams = httpParams.set(k, String(v));
      });
    }
    return this.http.get<any[]>(`${API_BASE_URL}/${resource}`, { params: httpParams });
  }

  getById(resource: string, id: number | string): Observable<any> {
    return this.http.get<any>(`${API_BASE_URL}/${resource}/${id}`);
  }

  create(resource: string, dto: any): Observable<any> {
    return this.http.post<any>(`${API_BASE_URL}/${resource}`, dto);
  }

  update(resource: string, id: number | string, dto: any): Observable<any> {
    return this.http.put<any>(`${API_BASE_URL}/${resource}/${id}`, dto);
  }

  delete(resource: string, id: number | string): Observable<void> {
    return this.http.delete<void>(`${API_BASE_URL}/${resource}/${id}`);
  }
}
