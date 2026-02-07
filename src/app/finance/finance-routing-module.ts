import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { Archive } from './pages/archive/archive';
import { Contracts } from './pages/contracts/contracts';
import { Invoice } from './pages/invoice/invoice';
import { Projects } from './pages/projects/projects';
import { Units } from './pages/units/units';
import { WorkOrders } from './pages/work-orders/work-orders';

const routes: Routes = [    
          { path: '', redirectTo: 'projects', pathMatch: 'full' },
          { path: 'archive', component: Archive },
          {path:'contracts',component:Contracts},
          {path:'invoice',component:Invoice},
          {path:'projects',component:Projects},
          {path:'units',component:Units},
          {path:'work-orders',component:WorkOrders},
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class FinanceRoutingModule { }
