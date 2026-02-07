import { Component } from '@angular/core';
import { RouterModule, RouterOutlet } from '@angular/router';
import { Header } from '../../components/header/header';
import { Sidebar } from '../../components/sidebar/sidebar';

@Component({
  selector: 'app-finance-layout',
  standalone: true,
  imports: [RouterOutlet,Header,Sidebar,RouterModule],
  templateUrl: './finance-layout.html',
  styleUrl: './finance-layout.css'
})
export class FinanceLayout {
  sidebarOpen = false;

}
