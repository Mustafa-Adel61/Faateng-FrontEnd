import { Component } from '@angular/core';
import { SharedArchive } from "../../../Shared/shared-components/shared-archive/shared-archive";



@Component({
  selector: 'app-archive',
  standalone: true,
  imports: [SharedArchive],
  templateUrl: './archive.html',
  styleUrl: './archive.css'
})
export class Archive {
}
