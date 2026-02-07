import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { Archive } from './pages/archive/archive';
import { Calendar } from './pages/calendar/calendar';
import { Checklists } from './pages/checklists/checklists';
import { ClientsContacts } from './pages/clients-contacts/clients-contacts';
import { Contracts } from './pages/contracts/contracts';
import { Dashboard } from './pages/dashboard/dashboard';
import { DispatcherView } from './pages/dispatcher-view/dispatcher-view';
import { FaultCodes } from './pages/fault-codes/fault-codes';
import { Inventory } from './pages/inventory/inventory';
import { Invoices } from './pages/invoices/invoices';
import { Projects } from './pages/projects/projects';
import { ProposalGenerator } from './pages/proposal-generator/proposal-generator';
import { SuggestedRepairsReview } from './pages/suggested-repairs-review/suggested-repairs-review';
import { TaskList } from './pages/task-list/task-list';
import { Training } from './pages/training/training';
import { UnitManuals } from './pages/unit-manuals/unit-manuals';
import { Units } from './pages/units/units';

const routes: Routes = [
   
        { path: '', redirectTo: 'task-list', pathMatch: 'full' },
        { path: 'archive', component: Archive },
        {path:'calendar',component:Calendar},
        {path:'checklists',component:Checklists},
        {path:'clients-contacts',component:ClientsContacts},
        {path:'contracts',component:Contracts},
        {path:'dashboard',component:Dashboard},
        {path:'dispatcher-view',component:DispatcherView},
        {path:'fault-codes',component:FaultCodes},
        {path:'inventory',component:Inventory},
        {path:'invoices',component:Invoices},
        {path:'projects',component:Projects},
        {path:'proposal-generator',component:ProposalGenerator},
        {path:'suggested-repairs-review',component:SuggestedRepairsReview},
        {path:'task-list',component:TaskList},
        {path:'training',component:Training},
        {path:'unit-manuals',component:UnitManuals},
        {path:'units',component:Units},
    
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class ManagerRoutingModule { }
