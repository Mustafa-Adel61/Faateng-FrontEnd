import { NgIf, NgFor, NgClass, CommonModule } from '@angular/common';
import { Component, Input, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CreateNewUnit } from '../../../admin/pages/create-new-unit/create-new-unit';
import { CreateServiceRequest } from '../../../client/pages/create-service-request/create-service-request';
import { SharedPageHeader } from '../../shared-layout/shared-page-header/shared-page-header';
import { UnitService, Unit } from '../../../core/unit.service';
import { ToastService } from '../../services/toast.service';
import { Loading } from '../loading/loading';
import { TaskService } from '../../../core/task.service';
import { ResourceService } from '../../../core/resource.service';
import { forkJoin, of } from 'rxjs';
import { switchMap, catchError } from 'rxjs/operators';

@Component({
  selector: 'app-shared-units',
  standalone: true,
  imports: [NgIf, NgFor, NgClass, CreateNewUnit, FormsModule, CommonModule, SharedPageHeader, CreateServiceRequest, Loading],
  templateUrl: './shared-units.html',
  styleUrl: './shared-units.css'
})
export class SharedUnits implements OnInit {

  @Input() role: 'admin' | 'dispatcher' | 'manager' | 'technician' | 'finance' | 'client' | null = null;

  showCreateUnitModal: boolean = false;
  showCreateRequestModal: boolean = false;
  selectedUnitForRequest: any = null;

  activeTab = 'Elevator';
  selectedUnitIndex: number | null = null;
  cardsPerRow = 1; // This logic seems flawed if css grid is used, but keeping existing logic

  allTabs = [
    'Elevator', 'Escalator', 'Moving Walk',
    'AHU', 'FCU', 'VRF / DX', 'Chiller', 'Cooling Tower',
    'Pump', 'Exhaust/Supply Fan', 'Package / Rooftop Unit'
  ];

  units: Unit[] = [];
  filteredUnits: Unit[] = [];

  private toast: ToastService = inject(ToastService);
  private resource: ResourceService = inject(ResourceService);
  private taskService: TaskService = inject(TaskService);
  constructor(private unitService: UnitService) {}
  loading: boolean = false;

  ngOnInit(): void {
    this.loadUnits();
  }

  loadUnits() {
    this.loading = true;

    if (this.role === 'technician') {
      // For technicians, we first get tasks to find assigned unit IDs
      // and then get all units and filter them.
      this.taskService.getAll().pipe(
        switchMap(tasks => {
          const assignedUnitIds = tasks.map(t => t.unitId).filter(id => !!id);
          if (assignedUnitIds.length === 0) {
            return of({ units: [], assignedIds: [] });
          }
          return forkJoin({
            units: this.unitService.getAll(),
            assignedIds: of(assignedUnitIds)
          });
        }),
        catchError(err => {
          console.error('Error loading technician data:', err);
          return of({ units: [], assignedIds: [] });
        })
      ).subscribe({
        next: (result: any) => {
          const { units, assignedIds } = result;
          if (assignedIds.length > 0) {
            this.units = units.filter((u: any) => assignedIds.includes(u.id));
          } else {
            this.units = [];
          }
          this.filterUnits();
          this.loading = false;
        },
        error: () => {
          this.loading = false;
        }
      });
    } else {
      this.unitService.getAll().subscribe({
        next: (items) => {
          this.units = items || [];
          this.filterUnits();
          this.loading = false;
        },
        error: (err) => {
          console.error(err);
          this.units = [];
          this.filteredUnits = [];
          this.loading = false;
        }
      });
    }
  }

  filterUnits() {
    if (this.role === 'client') {
      this.filteredUnits = this.units;
    } else {
      this.filteredUnits = this.units.filter(u => u.type === this.activeTab);
    }
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

  onNotify(msg: string) {
    this.toast.show(msg, 'success');
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
     const body = {
    ...unit,
    photos: this.getUnitPhotos(unit) // array
  };
    this.loading = true;
    this.unitService.update(unit.id, body).subscribe({
      next: (res) => {
        this.toast.show('تم تحديث الوحدة بنجاح', 'success');
        this.loadUnits(); // Reload to refresh any sync changes
        this.loading = false;
      },
      error: (err) => {
        console.error(err);
        this.toast.show('فشل تحديث الوحدة', 'error');
        this.loading = false;
      }
    });
  }

 getUnitPhotos(unit: Unit): string[] {
  if (!unit.photos) return [];
  if (typeof unit.photos === 'string') {
    try {
      const parsed = JSON.parse(unit.photos);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }
  return unit.photos; // لو أصلًا array
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

    this.loading = true;
    this.unitService.delete(unit.id).subscribe({
      next: () => {
        this.toast.show('تم حذف الوحدة بنجاح', 'success');
        this.selectedUnitIndex = null; // Close details
        this.loadUnits();
        this.loading = false;
      },
      error: (err) => {
        console.error(err);
        this.toast.show('فشل حذف الوحدة', 'error');
        this.loading = false;
      }
    });
  }
}