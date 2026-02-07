import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../core/auth';
import { NavbarLogin } from '../navbar-login/navbar-login';

@Component({
  selector: 'app-login',
  imports: [CommonModule,ReactiveFormsModule,NavbarLogin],
  templateUrl: './login.html',
  styleUrl: './login.css'
})
export class Login {

  private fb = inject(FormBuilder);
  private auth = inject(AuthService);
  private router = inject(Router);

  form = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', Validators.required]
  });

  error = '';

 async login() {
  const { email, password } = this.form.value;
  if (!email || !password) {
    this.error = 'Please fill all fields';
    return;
  }

  const success = await this.auth.login(email, password);
  if (!success) {
    this.error = 'Invalid credentials';
    return;
  }

  const role = this.auth.currentRole();
  if (!role) {
    this.error = 'Role not found';
    return;
  }
  this.router.navigate([`/dashboard/${role}`]);
 }

  goToRegister() {
    this.router.navigate(['/register']);
  }
}

