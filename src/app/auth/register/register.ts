import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { AuthService } from '../../core/auth';
import { Router } from '@angular/router';

@Component({
  selector: 'app-register',
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './register.html',
  styleUrl: './register.css'
})
export class Register {
  form: any;
  error = '';
  success = '';

  constructor(
    private fb: FormBuilder,
    private auth: AuthService,
    private router: Router
  ) {
    // ✅ هنا بقى الـ fb جاهز
    this.form = this.fb.group({
      fullName: ['', Validators.required],
      phone: ['', Validators.required],
      projectName: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      // position: ['', Validators.required],
      password: ['', Validators.required],
      role: ['client', Validators.required]
    });
  }

  register() {
    // console.log(this.form.value);
    const { email, password, role } = this.form.value;
    if (!email || !password) {
      this.error = 'Please fill all fields';
      this.success = '';
      return;
    }

    const payload = this.form.value;
    this.auth.registerAdmin({
      fullName: payload.fullName,
      phone: payload.phone,
      // position: payload.position,
      email,
      password,
      role
    }).subscribe({
      next: () => {
        this.error = '';
        this.success = 'Account created successfully!';
        setTimeout(() => this.router.navigate(['/login']), 1000);
      },
      error: (err) => {
        this.error = (err?.error || 'Registration failed');
        this.success = '';
      }
    });
  }
}
