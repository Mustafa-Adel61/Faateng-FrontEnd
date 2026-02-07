import { Component } from '@angular/core';
import { RouterModule, RouterOutlet } from '@angular/router';
import { Header } from '../../components/header/header';
import { Sidebar } from '../../components/sidebar/sidebar';
import { AdminRoutingModule } from '../../admin-routing-module';

@Component({
  selector: 'app-admin-layout',
  imports: [RouterOutlet,Header,Sidebar,RouterModule],
  templateUrl: './admin-layout.html',
  styleUrls: ['./admin-layout.css']
})
export class AdminLayout {
  sidebarOpen = false;

}
