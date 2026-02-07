import { Component } from '@angular/core';
import { RouterModule, RouterOutlet } from '@angular/router';
import { Header } from '../../components/header/header';
import { Sidebar } from '../../components/sidebar/sidebar';

@Component({
  selector: 'app-technician-layout',
  imports: [RouterOutlet,Header,Sidebar,RouterModule],
  templateUrl: './technician-layout.html',
  styleUrl: './technician-layout.css'
})
export class TechnicianLayout {
  sidebarOpen = false;

}
