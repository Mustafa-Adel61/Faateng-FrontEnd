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
export const routes: Routes = [
 
      { path: 'units', component:Units },
      { path: 'service-requests', component: ServiceRequests },
      { path: 'history', component: History },
      { path: 'invoices', component: Invoices },
      { path: 'contracts', component: Contracts },
      { path: 'reports-compliance', component: ReportsCompliance },
      { path: 'profile-details', component: ProfileDetails },
      { path: 'request-preview/:id', component: RequestPreview },
      { path: '', redirectTo: 'units', pathMatch: 'full' }//عشان اول ما يفتح يروح لل component دا 
      

];
@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class ClientRoutingModule { }