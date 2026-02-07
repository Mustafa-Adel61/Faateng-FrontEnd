import { Component } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { RouterModule, RouterOutlet } from '@angular/router';
import { SharedHeader } from "../shared-layout/shared-header/shared-header";
import { SharedSidebar } from '../shared-layout/shared-sidebar/shared-sidebar';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [RouterOutlet, RouterModule, SharedHeader, SharedSidebar],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css'
})
export class Dashboard {
  sidebarOpen = false;

  role: 'admin' | 'dispatcher' | 'manager' | 'technician' | 'client' | 'finance' | null = null;

  constructor(private router: Router) { }

  ngOnInit() {
    const url = this.router.url;  // مثال: /dashboard/admin
    const parts = url.split('/'); // ["", "dashboard", "admin"]
    this.role = parts[2] as 'admin' | 'dispatcher' | 'manager' | 'technician' | 'client' | 'finance';

    console.log('Current Role:', this.role);
  }
}

