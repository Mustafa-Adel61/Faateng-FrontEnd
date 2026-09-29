import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AdminRoutingModule } from './admin-routing-module';
import { Dashboard } from '../Shared/dashboard/dashboard';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

@NgModule({
  imports: [
    CommonModule,
    AdminRoutingModule,
    Dashboard,
    FormsModule,
    ReactiveFormsModule
  ]
})
export class AdminModule {}
