import { Component } from '@angular/core';
import { SharedContracts } from '../../../Shared/shared-components/shared-contracts/shared-contracts';

@Component({
  selector: 'app-admin-contracts',
  standalone: true,
  imports: [SharedContracts],
  templateUrl: './contracts.html',
  styleUrl: './contracts.css'
})
export class AdminContracts {
}
