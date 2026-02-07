import { Component } from '@angular/core';
import { SharedTraining } from "../../../Shared/shared-components/shared-training/shared-training";


@Component({
  selector: 'app-training',
  imports: [SharedTraining],
  templateUrl: './training.html',
  styleUrl: './training.css'
})
export class Training {
}