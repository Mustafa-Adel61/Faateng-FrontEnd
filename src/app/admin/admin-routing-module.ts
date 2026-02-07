
import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { TaskList } from './pages/task-list/task-list';
import { MapComponent } from './pages/map/map';
import { Calendar } from './pages/calendar/calendar';
import { Dispatcher } from './pages/dispatcher/dispatcher';
import { Training } from './pages/training/training';
import { Manual } from './pages/manual/manual';
import { Inventory } from './pages/inventory/inventory';
import { FaultCode } from './pages/fault-code/fault-code';
import { Billing } from './pages/billing/billing';
import { Contacts } from './pages/contacts/contacts';
import { Units } from './pages/units/units';
import { Projects } from './pages/projects/projects';
import { Archive } from './pages/archive/archive';
import { Technician } from './pages/technician/technician';
import { SuggestedRepairs } from './pages/suggested-repairs/suggested-repairs';
import { ReportDetails } from './pages/report-details/report-details';
import { ProposalGenerator } from './pages/proposal-generator/proposal-generator';
import { SuggestedRepairsDetails } from './pages/suggested-repairs-details/suggested-repairs-details';
import { ReportsReviewQueue } from './pages/reports-review-queue/reports-review-queue';
import { Invoices } from './pages/invoices/invoices';
import { AdminContracts } from './pages/contracts/contracts';
import { Register } from '../auth/register/register';
import { authGuard } from '../core/auth-guard';

export const routes: Routes = [

  //هنا بقول ان اول ما يدخل علي ال admin module هيروح لل layout عشان هيا الي مقسمه الشغل بتاعي بالترتيب
  // يعني فين ال sidebar-header-contant يبقي هيفتحها هي الاول وحط كل الملفات كأنها childreen ليها يعني تفتح منها 
  // فمثلا فتح ال layout في الاول هيفتح ال sidebar-header وبعدها عندي كلمه ال       <router-outlet></router-outlet>
  // <router-outlet></router-outlet>
  // دي هتحمل ال childreen في المكاتن دا من ال layout وطبعا هيكونو تابعين لل layout
  { path: '', redirectTo: 'tasks', pathMatch: 'full' },
  { path: 'map', component: MapComponent },
  { path: 'tasks', component: TaskList },
  { path: 'calendar', component: Calendar },
  { path: 'dispatcher', component: Dispatcher },
  { path: 'technician', component: Technician },
  { path: 'suggested-repairs', component: SuggestedRepairs },
  { path: 'archive', component: Archive },
  { path: 'projects', component: Projects },
  { path: 'units', component: Units },
  { path: 'contacts', component: Contacts },
  { path: 'billing', component: Billing },
  { path: 'inventory', component: Inventory },
  { path: 'fault-code', component: FaultCode },
  { path: 'manual', component: Manual },
  { path: 'training', component: Training },
  { path: 'proposal-generator', component: ProposalGenerator },
  { path: 'invoices', component: Invoices },
  { path: 'contracts', component: AdminContracts },
  { path: 'reports-review-queue', component: ReportsReviewQueue },
  { path: 'reports/:id', component: ReportDetails },
  { path: 'suggested-repairs/:Code', component: SuggestedRepairsDetails },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class AdminRoutingModule { }
