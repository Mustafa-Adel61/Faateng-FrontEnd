import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { API_BASE_URL } from './api.config';

interface User {
  email: string;
  password: string;
  role: 'admin' | 'client'|'dispatcher'|'technician'|'manager'|'finance';
  fullName?: string;
  phone?: string;
  projectName?: string;
  position?: string;
}
//injectable يعني جاهز ان اي حد يعمل منه inject وياخد نسخه منه في ال constructor بتاعه
@Injectable({
  // root يعني هو كدا هيعمل dependency injection من نوع singleton
  // لو مش عايزها singleton ممكن تحطه في ال providers بتاع الموديول اللي انت عايز تستخدمه فيه بس وهشيل ال root من هنا
  providedIn: 'root'
})
export class AuthService {

  private currentUser: any = null;

  constructor(private router: Router, private http: HttpClient) {}
  private getToken(): string | null {
    return localStorage.getItem('token');
  }
  private decodeJwt(): any | null {
    const t = this.getToken();
    if (!t) return null;
    const parts = t.split('.');
    if (parts.length !== 3) return null;
    try {
      const payload = parts[1].replace(/-/g, '+').replace(/_/g, '/');
      const json = atob(payload);
      return JSON.parse(json);
    } catch {
      return null;
    }
  }
  getUserEmail(): string | null {
    if (this.currentUser?.email) return this.currentUser.email;
    const d = this.decodeJwt();
    return d?.email || d?.Email || d?.unique_name || null;
  }
  getUserId(): string | null {
    const d = this.decodeJwt();
    return d?.sub || d?.nameid || d?.id || null;
  }

  /** تسجيل دخول عبر الـ API */
  async login(email: string, password: string): Promise<boolean> {
    try {
      const res = await this.http.post<{ token: string; role: User['role'] }>(`${API_BASE_URL}/Auth/login`, { Email: email, Password: password }).toPromise();
      if (!res || !res.token) return false;
      localStorage.setItem('token', res.token);
      if (res.role) {
        localStorage.setItem('role', res.role);
      }
      // يمكننا لاحقًا استدعاء /auth/me لجلب تفاصيل المستخدم
      this.currentUser = { email, role: res.role };
      return true;
    } catch (err) {
      return false;
    }
  }

  /** تسجيل مستخدم جديد (محاكاة مؤقتة) */
  registerMock(value: User) {
    // لا يوجد endpoint للتسجيل الآن؛ سنحتفظ بالسلوك المؤقت
    localStorage.setItem('user', JSON.stringify(value));
    this.currentUser = value;
    return true;
  }

  getUser() {
    return this.currentUser;
  }
  updateUser(data: any) {
    this.currentUser = { ...this.currentUser, ...data };
  }

  /** إنشاء مستخدم جديد عبر الـ API (للمشرف) */
  registerAdmin(payload: { fullName: string; phone?: string; position?: string; email: string; password: string; role: User['role'] }) {
    return this.http.post(`${API_BASE_URL}/auth/register`, {
      FullName: payload.fullName,
      Phone: payload.phone,
      Position: payload.position,
      Email: payload.email,
      Password: payload.password,
      Role: payload.role
    });
  }

  /** هل المستخدم مسجل دخول حاليًا؟ يعتمد على وجود التوكن */
  isLoggedIn(): boolean {
    const token = localStorage.getItem('token');
    return !!token;
  }

  /** جلب الدور الحالي */
  currentRole(): User['role'] | null {
    const role = localStorage.getItem('role') as User['role'] | null;
    return role;
  }

  /** تسجيل خروج */
  logout(): void {
    this.currentUser = null;
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    localStorage.removeItem('role');
    this.router.navigate(['/login']);
  }
}
