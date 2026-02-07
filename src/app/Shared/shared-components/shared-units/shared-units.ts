import { NgIf, NgFor, NgClass, CommonModule } from '@angular/common';
import { Component, Input, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CreateNewUnit } from '../../../admin/pages/create-new-unit/create-new-unit';
import { CreateServiceRequest } from '../../../client/pages/create-service-request/create-service-request';
import { SharedPageHeader } from '../../shared-layout/shared-page-header/shared-page-header';
import { UnitService, Unit } from '../../../core/unit.service';

@Component({
  selector: 'app-shared-units',
  standalone: true,
  imports: [NgIf, NgFor, NgClass, CreateNewUnit, FormsModule, CommonModule, SharedPageHeader, CreateServiceRequest],
  templateUrl: './shared-units.html',
  styleUrl: './shared-units.css'
})
export class SharedUnits implements OnInit {

  @Input() role: 'admin' | 'dispatcher' | 'manager' | 'technician' | 'finance' | 'client' | null = null;

  showCreateUnitModal: boolean = false;
  showCreateRequestModal: boolean = false;
  selectedUnitForRequest: any = null;

  activeTab = 'Lifts';
  selectedUnitIndex: number | null = null;
  cardsPerRow = 1; // This logic seems flawed if css grid is used, but keeping existing logic

  units: Unit[] = [];
  filteredUnits: Unit[] = [];

  constructor(private unitService: UnitService) {}

  ngOnInit(): void {
    this.loadUnits();
  }

  loadUnits() {
    this.unitService.getAll().subscribe({
      next: (items) => {
        this.units = items || [];
        this.filterUnits();
      },
      error: (err) => {
        console.error(err);
        this.units = [];
        this.filteredUnits = [];
      }
    });
  }

  filterUnits() {
    this.filteredUnits = this.units.filter(u => u.type === this.activeTab);
    this.selectedUnitIndex = null;
  }

  changeTab(tab: string) {
    this.activeTab = tab;
    this.filterUnits();
  }

  openCreateUnit() {
    this.showCreateUnitModal = true;
  }

  closeCreateUnit() {
    this.showCreateUnitModal = false;
  }

  saveNewReport(event: any) {
    this.loadUnits();
  }

  toggleDetails(index: number) {
    if (this.selectedUnitIndex === index) {
      this.selectedUnitIndex = null;
    } else {
      this.selectedUnitIndex = index;
    }
  }

  openCreateRequest(unit: any) {
    this.selectedUnitForRequest = unit;
    this.showCreateRequestModal = true;
  }

  closeCreateRequest() {
    this.showCreateRequestModal = false;
  }

  onRequestCreated(event: any) {
    // handle request created
  }

  saveUnitChanges(unit: Unit) {
    if (!unit.id) return;
    this.unitService.update(unit.id, unit).subscribe({
      next: (res) => {
        alert('Unit updated successfully');
        this.loadUnits(); // Reload to refresh any sync changes
      },
      error: (err) => {
        console.error(err);
        alert('Failed to update unit');
      }
    });
  }

  getUnitPhotos(unit: Unit): string[] {
    if (!unit.photos) return [];
    try {
      const parsed = JSON.parse(unit.photos);
      return Array.isArray(parsed) ? parsed : [];
    } catch (e) {
      return [];
    }
  }

  openPhoto(url: string) {
    const w = window.open('');
    if (w) {
      const isPdf = url.startsWith('data:application/pdf') || /\.pdf$/i.test(url);
      if (isPdf) {
         w.document.write(`<iframe src="${url}" style="width:100%;height:100%;border:none;"></iframe>`);
      } else {
         w.document.write(`<img src="${url}" style="max-width:100%">`);
      }
    }
  }

  deleteUnit(unit: Unit) {
    if (!unit.id) return;
    if (!confirm('Are you sure you want to delete this unit? This will also remove it from inventory.')) return;

    this.unitService.delete(unit.id).subscribe({
      next: () => {
        alert('Unit deleted successfully');
        this.selectedUnitIndex = null; // Close details
        this.loadUnits();
      },
      error: (err) => {
        console.error(err);
        alert('Failed to delete unit');
      }
    });
  }
}
