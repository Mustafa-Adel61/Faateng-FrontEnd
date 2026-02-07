import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { Archive } from './pages/archive/archive';
import { Calendar } from './pages/calendar/calendar';
import { Checklists } from './pages/checklists/checklists';
import { DispatcherView } from './pages/dispatcher-view/dispatcher-view';
import { FaultCodes } from './pages/fault-codes/fault-codes';
import { Inventory } from './pages/inventory/inventory';
import { Projects } from './pages/projects/projects';
import { TaskList } from './pages/task-list/task-list';
import { Training } from './pages/training/training';
import { UnitManuals } from './pages/unit-manuals/unit-manuals';
import { Units } from './pages/units/units';
import { ServiceRequests } from './pages/service-requests/service-requests';

const routes: Routes = [
 
      { path: '', redirectTo: 'task-list', pathMatch: 'full' },
      { path: 'archive', component: Archive },
      { path: 'calendar', component: Calendar },
      {path:'checklists',component:Checklists},
      {path:'dispatcher-view',component:DispatcherView},
      {path:'fault-codes',component:FaultCodes},
      {path:'inventory',component:Inventory},
      {path:'projects',component:Projects},
      {path:'task-list',component:TaskList},
      {path:'service-requests',component:ServiceRequests},
      {path:'training',component:Training},
      {path:'unit-manuals',component:UnitManuals},
      {path:'units',component:Units},  
  
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class DispatcherRoutingModule { }
