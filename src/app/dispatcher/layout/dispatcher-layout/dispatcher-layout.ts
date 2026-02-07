import { Component } from '@angular/core';
import { RouterModule, RouterOutlet } from '@angular/router';
import { Header } from '../../components/header/header';
import { Sidebar } from '../../components/sidebar/sidebar';

@Component({
  selector: 'app-dispatcher-layout',
  standalone: true,
  imports: [RouterOutlet,Header,Sidebar,RouterModule],
  templateUrl: './dispatcher-layout.html',
  styleUrl: './dispatcher-layout.css'
})
export class DispatcherLayout {
  sidebarOpen = false;

}
