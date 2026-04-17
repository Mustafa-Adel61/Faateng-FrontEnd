import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { TechnicianLayout } from './layout/technician-layout/technician-layout';
import { Calendar } from './pages/calendar/calendar';
import { Checklists } from './pages/checklists/checklists';
import { FaultCodes } from './pages/fault-codes/fault-codes';
import { Inventory } from './pages/inventory/inventory';
import { SuggestedRepairs } from './pages/suggested-repairs/suggested-repairs';
import { TaskList } from './pages/task-list/task-list';
import { Training } from './pages/training/training';
import { UnitManuals } from './pages/unit-manuals/unit-manuals';
import { ChecklistFlow } from '../Shared/shared-components/checklist/checklist-flow';
import { ChecklistList } from '../Shared/shared-components/checklist/checklist-list';
import { ChecklistDetails } from '../Shared/shared-components/checklist/checklist-details';

const routes: Routes = [
  
        { path: '', redirectTo: 'task-list', pathMatch: 'full' },
        { path: 'calendar', component: Calendar },
        {path:'checklists',component:Checklists},
        {path:'checklist',component:ChecklistFlow},
        {path:'checklist-list',component:ChecklistList},
        {path:'checklist-details/:id',component:ChecklistDetails},
        {path:'fault-codes',component:FaultCodes},
        {path:'inventory',component:Inventory},
        {path:'suggested-repairs',component:SuggestedRepairs},
        {path:'task-list',component:TaskList},
        {path:'training',component:Training},
        {path:'unit-manuals',component:UnitManuals},
    
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class TechnicianRoutingModule { }
