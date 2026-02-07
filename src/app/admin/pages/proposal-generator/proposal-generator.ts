import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { SharedPersonalGenerator } from '../../../Shared/shared-components/shared-personal-generator/shared-personal-generator';

@Component({
  selector: 'app-proposal-generator',
  imports: [ FormsModule, SharedPersonalGenerator],
  templateUrl: './proposal-generator.html',
  styleUrl: './proposal-generator.css'
})
export class ProposalGenerator {

}