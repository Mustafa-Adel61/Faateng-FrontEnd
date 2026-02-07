import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AdminRoutingModule } from './admin-routing-module';
import { Dashboard } from '../Shared/dashboard/dashboard';

@NgModule({
  imports: [
    CommonModule,
    AdminRoutingModule,
    Dashboard,

  ]
})
export class AdminModule {}
