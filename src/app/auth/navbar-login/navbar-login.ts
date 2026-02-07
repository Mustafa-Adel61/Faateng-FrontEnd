import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';

@Component({
  selector: 'app-navbar-login',
  imports: [CommonModule],
  templateUrl: './navbar-login.html',
  styleUrl: './navbar-login.css'
})
export class NavbarLogin {
  isMenuOpen = false;

  toggleMenu() {
    this.isMenuOpen = !this.isMenuOpen;
  }
}
