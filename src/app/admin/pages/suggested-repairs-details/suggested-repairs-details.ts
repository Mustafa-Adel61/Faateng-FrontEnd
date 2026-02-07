import { NgClass, NgIf } from '@angular/common';
import { Component } from '@angular/core';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-suggested-repairs-details',
  imports: [NgClass,NgIf],
  templateUrl: './suggested-repairs-details.html',
  styleUrl: './suggested-repairs-details.css'
})
export class SuggestedRepairsDetails {
  Code: string | null = null;
  repairDetails: any = null;

  // بيانات ثابتة مؤقتة (placeholder data)
  private dummyRepairsData: Record<string, any> = {
    '#P1': {
      Code: '#P1',
      projectName:  `Project ${1}`,
      technicianName: 'Mustafa Adel',
      location: 'Cairo',
      unitType: 'Elevator',
      priority: 'medium',
      issueDescription: 'Door sensor malfunction',
      suggestedRepair: 'Refrigerant leak (Zone 5)'
    },
    '#P2': {
      Code: '#P2',
      projectName:  `Project ${2}`,
      technicianName: 'Salah Hassan',
      location: 'Alexandria',
      unitType: 'Fire System',
      priority: 'high',
      issueDescription: 'Refrigerant leak (Zone 5)',
      suggestedRepair: 'Replace IR sensor'
    }
  };

  constructor(private route: ActivatedRoute) {}

  ngOnInit(): void {
    // جلب الـ ID من URL (زي /admin/suggested-repairs/#P1)
    this.Code = this.route.snapshot.paramMap.get('Code');
    console.log(this.Code);
    
    if (this.Code && this.dummyRepairsData[this.Code]) {
      this.repairDetails = this.dummyRepairsData[this.Code];
    }
  }
}
