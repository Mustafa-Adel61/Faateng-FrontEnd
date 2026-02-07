import { Component } from '@angular/core';
import { RouterModule, RouterOutlet } from '@angular/router';
import { Header } from '../../components/header/header';
import { Sidebar } from '../../components/sidebar/sidebar';

@Component({
  selector: 'app-manager-layout',
  standalone: true,
  imports: [RouterOutlet,Header,Sidebar,RouterModule],
  templateUrl: './manager-layout.html',
  styleUrl: './manager-layout.css'
})
export class ManagerLayout {
  sidebarOpen = false;

}
