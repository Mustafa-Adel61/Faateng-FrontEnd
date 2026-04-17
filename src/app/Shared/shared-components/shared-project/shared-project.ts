import { SharedPageHeader } from './../../shared-layout/shared-page-header/shared-page-header';
import { NgIf, NgFor, NgClass } from '@angular/common';
import { Component, Input, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CreateNewProject } from '../../../admin/pages/create-new-project/create-new-project';
import { ProjectDetails } from '../../../admin/pages/project-details/project-details';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { ResourceService } from '../../../core/resource.service';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { Loading } from "../loading/loading";

interface Task {
  id?: number;
  ProjectIdStr?: string; // Added for Auto-ID
  selected: boolean;
  Project: string;
  Client: string;
  siteAddress: string;
  Scopes: number;
  Units: number;
  OpenTasks: number;
  BookedValue: number;
  Status?: string;
}
@Component({
  selector: 'app-shared-project',
  imports: [FormsModule, NgIf, NgFor, CreateNewProject, ProjectDetails, SharedPageHeader, Loading],
  templateUrl: './shared-project.html',
  styleUrl: './shared-project.css'
})
export class SharedProject {
  activeTab: 'list' | 'map' = 'list';
  detailsTab: 'Overview' | 'Scopes' | 'Unit' | 'Tasks' | 'Reports' | 'Billing' | 'File' = 'Overview';
  mapUrl: SafeResourceUrl;

  // UI state
  showCreate = false;
  showFilterBuilder = false;
  newFilter = { field: '', value: '' };
  activeFilters: { field: string; value: string }[] = [];

  // details panel
  showDetails = false;
  selectedTask: Task | null = null;

  // Selection
  allSelected = false;
  //  search text
  searchText: string = '';

  // Pagination
  page = 1;
  pageSize = 10;
  @Input() role: 'admin' | 'dispatcher' | 'manager' | 'client' | 'finance' | null = null;
  loading: boolean = false;

  ngOnInit(): void { this.loadTasks(); }
  tasks: Task[] = [];
  loadTasks() {
    this.loading = true;
    const params: Record<string, string> = {};
    if (this.role) params['role'] = this.role;
    this.resourceService.getAll('Projects', params).subscribe({
      next: (projects) => {
        this.tasks = (projects || []).map((p: any) => ({
          id: p.id,
          ProjectIdStr: p.projectIdStr, // Set auto-ID
          selected: false,
          Project: p.name || 'Unknown Project',
          Client: p.clientName || '',
          siteAddress: p.location || '',
          Scopes: p.scopesCount || 0,
          Units: Number(p.unitsCount ?? 0),
          OpenTasks: Number(p.tasksCount ?? 0),
          BookedValue: p.budget || 0,
          Status: p.status
        }));
        this.loading = false;
      },
      error: () => {
        this.tasks = [];
      }
    });
  }


  onSelectChange(task: Task, event: any) {
    const action = event.target.value;
    if (action === 'view') {
      this.openDetails(task);
    } else if (action === 'delete') {
      // Implement delete
      if (confirm('Are you sure you want to delete this project?')) {
        if (task.id) {
          this.loading = true;
          this.resourceService.delete('Projects', task.id).subscribe({
            next: () => {
              this.loadTasks();
              this.loading = false;
            },
            error: () => {
              this.loadTasks();
              this.loading = false;
            }
          });
        }
      }
    } else if (action === 'approve') {
      if (task.id) {
        this.loading = true;
        this.resourceService.update('Projects', task.id + '/approve', {}).subscribe({
          next: () => {
            task.Status = 'Approved';
            alert('Project Approved');
            this.loading = false;
          },
          error: () => {
            this.loading = false;
          }
        });
      }
    } else if (action === 'reject') {
      if (task.id) {
        this.loading = true;
        this.resourceService.update('Projects', task.id + '/reject', {}).subscribe({
          next: () => {
            task.Status = 'Rejected';
            alert('Project Rejected');
            this.loading = false;
          },
          error: () => {
            this.loading = false;
          }
        });
      }
    }
    // Reset select
    event.target.value = '';
  }


  loadMockTasks() {
    if (this.role === 'admin' || this.role === 'manager') {
      this.tasks = [
        {
          selected: false,
          Project: 'Carlton Hotel – Damascus',
          Client: 'Carlton Group',
          siteAddress: 'Damascus',
          Scopes: 2,
          Units: 2,
          OpenTasks: 2,
          BookedValue: 25000,
        },
        {
          selected: false,
          Project: 'EU Embassy',
          Client: '	European Union',
          siteAddress: 'Damascus',
          Scopes: 2,
          Units: 1,
          OpenTasks: 1,
          BookedValue: 80000,
        },
        {
          selected: false,
          Project: 'Park Residence',
          Client: 'Marota Holdings',
          siteAddress: 'Damascus',
          Scopes: 1,
          Units: 1,
          OpenTasks: 1,
          BookedValue: 12000,
        },
        {
          selected: false,
          Project: 'Carlton Hotel – Damascus',
          Client: 'Carlton Group',
          siteAddress: 'Damascus',
          Scopes: 2,
          Units: 2,
          OpenTasks: 2,
          BookedValue: 24000,
        },
      ];
    }
    else if (this.role === 'client') {
      this.tasks = [
        {
          selected: false,
          Project: 'Carlton Hotel – Damascus',
          Client: 'Carlton Group',
          siteAddress: 'Damascus',
          Scopes: 2,
          Units: 2,
          OpenTasks: 2,
          BookedValue: 25000,
        },
      ];
    }
    else if (this.role === 'finance') {
      this.tasks = [
        {
          selected: false,
          Project: 'Carlton Hotel – Damascus',
          Client: 'Carlton Group',
          siteAddress: 'Damascus',
          Scopes: 2,
          Units: 2,
          OpenTasks: 2,
          BookedValue: 25000,
        },
      ];
    }
    else if (this.role === 'dispatcher') {
      this.tasks = [
        {
          selected: false,
          Project: 'Carlton Hotel – Damascus',
          Client: 'Carlton Group',
          siteAddress: 'Damascus',
          Scopes: 2,
          Units: 2,
          OpenTasks: 2,
          BookedValue: 25000,
        },
      ];
    }
  }

  // دا قبل مااعمل الشكل الي طالبه الclient
  // بيانات تجريبية
  // tasks = Array.from({ length: 90 }).map((_, i) => ({
  //   selected: false,
  // code: `#P ${i + 1}`,
  // name: `Project ${i + 1}`,
  // Assignee: i % 2 === 0 ? 'Mustafa Adel' : 'Salah Hassan',
  // Location: i % 2 === 0 ? 'Cairo' : 'Alexandria',
  // units: 'UNITREF1#,UNITREF2#,UNITREF3#,',
  // CountCount_Of_Contents: `${i + 4}`

  //Data from Create New project page
  // طبعا انا حاطت اي كلام في ال data عشان بس يبان شكل ال project page زي في figma وبعد كدا اظبطها بكل نوع 
  // clientOrCompanyName: `#P ${i + 1}`,
  // projectName: `Project ${i + 1}`,
  //     ProjectType:  i % 2 === 0 ? 'Mustafa Adel' : 'Salah Hassan',
  //     PrimeContactName: i % 2 === 0 ? 'Cairo' : 'Alexandria',        
  //     jopTitle:  'UNITREF1#,UNITREF2#,UNITREF3#,',
  //     phoneNumber: `${i + 4}`,
  //     emailAddress : '',
  //     emailAddress2: '',
  //     secondryContact: '',
  //     contractStartDate: '',
  //     contractEndDate: '',
  //     maintenanceStartDate: '',
  //     contractDuration: '',
  //     contractType: '',
  //     paymentTerms: '',
  //     files: [] as string[] ,
  //     siteAddress: '',
  //     siteAddressGoogleMapLocation: '',
  //     region: '',
  //     regionGoogleMapLocation: '',
  //     onSiteContact: '',
  //     unitType: '',
  //     // Last Page
  //     BOQ_ShopDrawing: [] as string[] ,
  //     Notes_SpecialInstructio: '',

  //     //if unit type is Elevator
  //     numberOfElevators: '',
  //     doorType: '',
  //     type: '',
  //     machineRoom: '',
  //     numberOfStops: '',
  //     modelOrBrand: '',
  //     controllerType: '',
  //     serialNumber: '',
  //     notes: '',

  //     //if unit type is Escalators/MovingWalks
  //     numberOfEscalators: '',
  //     TravelHeight: '',
  //     indoor_outdoor: '',
  //     handrailLighting: '',
  //     EscalatorsBrandOrModel: '',
  //     EscalatorsSerialNumber: '',

  //     //if unit type is HVAC-Chillers
  //     numberOfChillers: '',
  //     Chillerstype: '',
  //     capacity: '',
  //     ChillerBrandOrModel: '',
  //     coolingTowerAttached: '',
  //     ChillerserialNumber: '',

  //     //if unit type is HVAC-Fujitsu VRF System
  //     numberOfOutdoorUnits: '',
  //     controlType: '',
  //     totalIndoorUnits: '',
  //     installationType: '',
  //     outdoorUnitCapacity: '',
  //     HVAC_FujitsuserialNumber: '',

  //     //if unit type is HVAC-FireSystem
  //     fireAlarmControlPanelBrandOrModel: '',
  //     hanrailLighting: '',
  //     numberOfZonesOrLoops: '',
  //     firePumpType: '',
  //     smokeDetectorsCallPoints: '',
  //     hoseCabinets_ExtinguishersCount: '',
  //     FireSystemCapacity: '',
  //     lastCivilDefenseApprovalDate: '',   



  //     }));
  // ---------------- selection ----------------

  constructor(private sanitizer: DomSanitizer, private resourceService: ResourceService) {
    this.mapUrl = this.sanitizer.bypassSecurityTrustResourceUrl(
      'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d53291.429!2d36.2165!3d33.5138!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x1518e75e1b2b1b2b%3A0x7d0b0b0b0b0b0b!2sDamascus!5e0!3m2!1sen!2ssy!4v1660000000000!5m2!1sen!2ssy'
    );
  }

  selectedCount = 0;
  toggleAll() {
    this.pagedTasks.forEach(t => (t.selected = this.allSelected));
    this.selectedCount = this.pagedTasks.filter(t => t.selected).length;
  }
  numberOfSelcted: number = 0;
  updateAllSelected() {
    // update global checkbox according to visible (paged) items
    this.allSelected =
      this.pagedTasks.length > 0 &&
      this.pagedTasks.every(t => t.selected);
    // بظبط عدد المحددين
    this.selectedCount = this.pagedTasks.filter(t => t.selected).length;
  }
  // ---------------- pagination / filtered list getters ----------------
  get filteredTasks(): Task[] {
    console.log("SASA");

    let result = this.tasks;

    // 🔹 أولاً: فلترة حسب الفلاتر النشطة (لو موجودة)
    if (this.activeFilters.length) {
      result = result.filter(task =>
        this.activeFilters.every(f => {
          const v = (task as any)[f.field];
          if (v == null) return false;
          return String(v).toLowerCase() === String(f.value).toLowerCase();
        })
      );
    }

    // 🔹 ثانياً: فلترة حسب البحث في الاسم (Project / Site)
    if (this.searchText.trim() !== '') {
      const search = this.searchText.toLowerCase();
      result = result.filter(task => task.Project.toLowerCase().includes(search));
    }

    return result;
  }

  get totalPages(): number {
    return Math.max(1, Math.ceil(this.filteredTasks.length / this.pageSize));
  }

  get pagedTasks(): Task[] {
    const start = (this.page - 1) * this.pageSize;
    return this.filteredTasks.slice(start, start + this.pageSize);
  }

  get visiblePages(): number[] {
    const pages: number[] = [];
    const maxButtons = 5;
    if (this.totalPages <= maxButtons) {
      for (let i = 1; i <= this.totalPages; i++) pages.push(i);
    } else {
      let start = this.page - Math.floor(maxButtons / 2);
      let end = this.page + Math.floor(maxButtons / 2);
      if (start < 1) {
        start = 1;
        end = maxButtons;
      }
      if (end > this.totalPages) {
        end = this.totalPages;
        start = this.totalPages - maxButtons + 1;
      }
      for (let i = start; i <= end; i++) pages.push(i);
    }
    return pages;
  }


  setPage(p: number) {
    if (p >= 1 && p <= this.totalPages) this.page = p;
  }

  // ---------------- filter builder ----------------
  toggleFilterBuilder() {
    this.showFilterBuilder = !this.showFilterBuilder;
    // reset newFilter
    this.newFilter = { field: '', value: '' };
  }

  getFilterValues(field: string): string[] {
    if (!field) return [];
    const values = this.tasks
      .map(t => (t as any)[field])
      .filter(v => v !== undefined && v !== null)
      .map(v => String(v));

    return Array.from(new Set(values));
  }


  //   constructor(
  //     private sanitizer: DomSanitizer,
  //     private route: ActivatedRoute
  //   ) {
  //  this.mapUrl = this.sanitizer.bypassSecurityTrustResourceUrl(
  //   'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d53291.429!2d36.2165!3d33.5138!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x1518e75e1b2b1b2b%3A0x7d0b0b0b0b0b0b!2sDamascus!5e0!3m2!1sen!2ssy!4v1660000000000!5m2!1sen!2ssy'
  // );
  //   }

  //   ngOnInit() {
  //     this.route.queryParams.subscribe(params => {
  //       const tab = params['tab'];
  //       this.activeTab = tab === 'map' ? 'map' : 'list';
  //     });
  //   }

  // ---------------- filter builder ----------------


  applyFilter() {
    if (!this.newFilter.field || !this.newFilter.value) return;
    this.activeFilters.push({ ...this.newFilter });
    this.newFilter = { field: '', value: '' };
    this.showFilterBuilder = false;
    // reset to page 1
    this.page = 1;
  }

  removeFilter(idx: number) {
    this.activeFilters.splice(idx, 1);
    // keep page valid
    if (this.page > this.totalPages) this.page = this.totalPages;
  }

  clearAllFilters() {
    this.activeFilters = [];
    this.page = 1;
  }

  // ---------------- actions ----------------
  performAction(task: Task, action: string) {
    if (action === 'view') {
      this.openDetails(task);
    } else if (action === 'edit') {
      // تنفيذ edit: هنا مجرد alert مثال
      alert(`Edit: ${task.Project}`);
    } else if (action === 'delete') {
      if (!confirm(`Delete ${task.Project}?`)) return;
      // حذف من المصدر
      const idx = this.tasks.indexOf(task);
      if (idx >= 0) this.tasks.splice(idx, 1);
      // adjust pagination if needed
      if (this.page > this.totalPages) this.page = this.totalPages;
    }
  }



  // ---------------- details panel ----------------
  openDetails(task: Task) {
    this.selectedTask = task;
    this.showDetails = true;
    // scroll to top so details visible (optional)
    window.scrollTo({ top: 0, behavior: 'smooth' });
    document.body.style.overflow = 'hidden'; // يمنع scroll الصفحة

  }

  closeDetails() {
    this.selectedTask = null;
    this.showDetails = false;
    document.body.style.overflow = 'auto'; // يرجع scroll الصفحة

  }
  //   getSortedStatuses(current: any) {
  //   return [current, ...this.statuses.filter(s => s !== current)];
  // }

  // updateTaskStatus(task: any) {
  //   const index = this.tasks.findIndex(t => t.name === task.name);
  //   if (index !== -1) {
  //     this.tasks[index].status = task.status;
  //   }
  // }
  //create new visit modal logic


  openCreate() {
    this.showCreate = true;
    // ارفع الصفحة لفوق عشان يبان المودال فوق الكل
    window.scrollTo({ top: 0, behavior: 'smooth' });
    document.body.style.overflow = 'hidden'; // يمنع scroll الصفحة

  }
  closeCreate() {
    this.showCreate = false;
    document.body.style.overflow = 'auto'; // يرجع scroll الصفحة

  }

  addProject(payload: any) {
    if (!payload) {
      this.closeCreate();
      return;
    }
    this.loading = true;
    this.resourceService.create('Projects', payload).subscribe({
      next: () => {
        this.loadTasks();
        this.closeCreate();
        this.loading = false;
      },
      error: () => {
        this.loading = false;
        alert('Error creating project');
      }
    });
  }
}
