import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NgIf } from '@angular/common';

@Component({
  selector: 'app-loading',
  imports: [CommonModule, NgIf],
  templateUrl: './loading.html',
  styleUrl: './loading.css'
})
export class Loading {
 @Input() loading: boolean = false; // 👈 مهم جدًا
  constructor() {}

  ngOnInit(): void {}
}
