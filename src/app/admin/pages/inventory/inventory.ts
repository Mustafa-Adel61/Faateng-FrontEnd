import { Component } from '@angular/core';
import { SharedInventory } from "../../../Shared/shared-components/shared-inventory/shared-inventory";
@Component({
  selector: 'app-inventory',
  standalone: true,
  imports: [SharedInventory],
  templateUrl: './inventory.html',
  styleUrl: './inventory.css'
})
export class Inventory {
}
