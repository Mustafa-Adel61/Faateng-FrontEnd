import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { ServiceRequests } from './pages/service-requests/service-requests';
import { Units } from './pages/units/units';
import { History } from './pages/history/history';
import { Invoices } from './pages/invoices/invoices';
import { Contracts } from './pages/contracts/contracts';
import { ReportsCompliance } from './pages/reports-compliance/reports-compliance';
import { RequestPreview } from './pages/request-preview/request-preview';
import { ProfileDetails } from './pages/profile-details/profile-details';
import { ClientOverview } from './pages/overview/client-overview';
import { Maintenance } from './pages/maintenance/maintenance';
import { Calendar } from './pages/calendar/calendar';
import { Documents } from './pages/documents/documents';

export const routes: Routes = [
  { path: 'overview', component: ClientOverview },
      { path: 'units', component:Units },
      { path: 'maintenance', component: Maintenance },
      { path: 'calendar', component: Calendar },
      { path: 'documents', component: Documents },
      { path: 'service-requests', component: ServiceRequests },
      { path: 'history', component: History },
      { path: 'invoices', component: Invoices },
      { path: 'contracts', component: Contracts },
      { path: 'reports-compliance', component: ReportsCompliance },
      { path: 'profile-details', component: ProfileDetails },
      { path: 'request-preview/:id', component: RequestPreview },
      { path: 'checklist', redirectTo: '/dashboard/admin/checklist', pathMatch: 'full' },
      { path: 'checklist-list', redirectTo: '/dashboard/admin/submissions', pathMatch: 'full' },
      { path: 'checklist-details/:id', redirectTo: '/dashboard/admin/submissions/:id', pathMatch: 'full' },
      { path: '', redirectTo: 'overview', pathMatch: 'full' }
      
];
@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class ClientRoutingModule { }