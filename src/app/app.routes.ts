import { DispatcherModule } from './dispatcher/dispatcher-module';
import { Login } from './auth/login/login';
import { ClientModule } from './client/client-module';
import { Routes, UrlSegment } from '@angular/router';
import { authGuard } from './core/auth-guard';
import { Register } from './auth/register/register';
import { Dashboard } from './Shared/dashboard/dashboard';

export const routes: Routes = [
  // عملت full عشان يدور علي كلمه login بالظبط مش اي كلمه تحتوي علي كلمه login
  { path: '', redirectTo: '/login', pathMatch: 'full' },
  {
     path: 'login',
    component: Login },
  {
     path: 'register',
    component: Register 
  },
    {
    path: 'dashboard/admin',
    component: Dashboard,
    canActivate: [authGuard],
    loadChildren: () => import('./admin/admin.module').then(m => m.AdminModule),
  },
  {
    path: 'dashboard/dispatcher',
    component: Dashboard,
    canActivate: [authGuard],
    loadChildren: () => import('./dispatcher/dispatcher-module').then(m => m.DispatcherModule),
  },
  {
    path: 'dashboard/technician',
    component: Dashboard,
    canActivate: [authGuard],
    loadChildren: () => import('./technician/technician-module').then(m => m.TechnicianModule),
  },
  {
    path: 'dashboard/client',
    component: Dashboard,
    canActivate: [authGuard],
    loadChildren: () => import('./client/client-module').then(m => m.ClientModule),
  },
  {
    path: 'dashboard/manager',
    component: Dashboard,
    canActivate: [authGuard],
    loadChildren: () => import('./manager/manager-module').then(m => m.ManagerModule),
  },
  {
    path: 'dashboard/finance',
    component: Dashboard,
    canActivate: [authGuard],
    loadChildren: () => import('./finance/finance-module').then(m => m.FinanceModule),
  },

  { path: '**', redirectTo: '/login' }

  // Dashboard route
  // {
  //   path: 'dashboard/:role',
  //   component: Dashboard,
  //   canActivate: [authGuard],
  //   loadChildren: () => {
  //     const role = localStorage.getItem('role') || 'client';
  //     console.log("SASASASASASASASASASASASASASASASASASASASASASAS");
  //     console.log(role);
  //     switch (role) {
  //       case 'admin':
  //         return import('./admin/admin.module').then(m => m.AdminModule);
  //       case 'client':
  //         return import('./client/client.module').then(m => m.ClientModule);
  //       case 'dispatcher':
  //         return import('./dispatcher/dispatcher-module').then(m => m.DispatcherModule);
  //       case 'technician':
  //         return import('./technician/technician-module').then(m => m.TechnicianModule);
  //       case 'manager':
  //         return import('./manager/manager-module').then(m => m.ManagerModule);
  //       case 'finance':
  //         return import('./finance/finance-module').then(m => m.FinanceModule);
  //         default:
  //         return import('./finance/finance-module').then(m => m.FinanceModule);
  //     }
  //   }
  // },

  // { path: '**', redirectTo: '/login' }  
];
