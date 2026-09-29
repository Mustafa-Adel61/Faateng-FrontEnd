import { Component, Input, OnInit, inject } from '@angular/core';
import { CommonModule, NgFor, NgIf } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ResourceService } from '../../../core/resource.service';
import { SharedPageHeader } from '../../shared-layout/shared-page-header/shared-page-header';
import { CreateNewContact } from "../../../admin/pages/create-new-contact/create-new-contact";
import { Loading } from '../loading/loading';
import { ToastService } from '../../../Shared/services/toast.service';

interface Contract {
  id: number;
  selected: boolean;
  Title: string;
  Type: string;
  Status: string;
  Value: number;
  StartDate: string;
  EndDate: string;
  Client: string;
  Project: string;
  UnitsCount: number;
  Units: ContractUnitInfo[];
  DaysLeft: string;
  Cycle: string;
  NextBill: string;
  Terms?: string;
  raw?: any;
}

interface ContractUnitInfo {
  id: number;
  name: string;
  model: string;
  serial: string;
  type?: string;
}

@Component({
  selector: 'app-shared-contracts',
  standalone: true,
  imports: [CommonModule, FormsModule, NgIf, NgFor, SharedPageHeader, CreateNewContact, Loading],
  templateUrl: './shared-contracts.html',
  styleUrl: './shared-contracts.css'
})
export class SharedContracts implements OnInit {
  @Input() role: 'admin' | 'dispatcher' | 'manager' | 'client' | 'finance' | null = null;
  
  contracts: Contract[] = [];
  activeTab: 'list' | 'map' = 'list';
  searchText: string = '';
  allSelected = false;
  totalCount = 0;
  approvedCount = 0;
  rejectedCount = 0;
  activeCount = 0;
  totalValue = 0;
  showDetails = false;
  selected: any = null;
  detailsPhotos: string[] = [];
  showFilterBuilder = false;
  quickClient: string = '';
  quickProject: string = '';
  quickType: string = '';
  quickCycle: string = '';
  quickStatus: string = '';
  activeFilters: { field: string; value: string }[] = [];
  selectedCount = 0;
  // Pagination
  page = 1;
  pageSize = 10;
  loading: boolean = false;

  constructor(private resourceService: ResourceService, private toast: ToastService) {}

  ngOnInit(): void {
    this.loadContracts();
  }

  loadContracts() {
    this.loading = true;
    this.resourceService.getAll('Contracts').subscribe({
      next: (items: any[]) => {
        this.contracts = items.map(c => this.mapContract(c));
        console.log("this.contracts",items);
        
        this.totalCount = items.length;
        this.approvedCount = items.filter(c => c.status === 'Approved').length;
        this.rejectedCount = items.filter(c => c.status === 'Rejected').length;
        this.activeCount = items.filter(c => (c.status || '').toLowerCase() === 'active').length;
        this.totalValue = items.reduce((sum, c) => sum + (Number(c.value) || 0), 0);
        this.loading = false;
      },
      error: (err) => {
        console.error('Failed to load contracts', err);
        this.loading = false;
      }
    });
  }


  private mapContract(c: any): Contract {
    const end = c.endDate ? new Date(c.endDate) : null;
    const now = new Date();
    let daysLeft = 'Expired';
    if (end && end > now) {
      const diff = Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      daysLeft = diff + 'd';
    }

    return {
      id: c.id,
      selected: false,
      Title: c.title || 'Untitled Contract',
      Type: c.type || 'Standard',
      Status: c.status || 'Draft',
      Value: c.value || 0,
      StartDate: c.startDate ? new Date(c.startDate).toLocaleDateString('en-CA') : '',
      EndDate: c.endDate ? new Date(c.endDate).toLocaleDateString('en-CA') : '',
      Client: c.clientName || 'Unknown Client',
      Project: c.projectName || 'No Project',
      Units: this.mapUnits(c.units),
      UnitsCount: Array.isArray(c.units) ? c.units.length : 0,
      DaysLeft: daysLeft,
      Cycle: c.visitFrequency || 'One-off',
      // NextBill: this.calculateNextBill(c.startDate, c.visitFrequency),
      NextBill: c.nextVisit
  ? new Date(c.nextVisit).toLocaleDateString('en-CA')
  : '--',
      Terms: c.terms,
      raw: c
    };
  }

  private mapUnits(units: any): ContractUnitInfo[] {
    if (!Array.isArray(units)) return [];
    return units.map((unit: any) => ({
      id: Number(unit.id),
      model: unit.model || unit.name || 'Unnamed unit',
      serial: unit.serial || '',
      type: unit.type || '',
      name: `${unit.model || unit.name || 'Unnamed unit'}${unit.serial ? ` (${unit.serial})` : ''}`
    }));
  }

  // private calculateNextBill(start: string, freq: string): string {
  //   if (!start || !freq || freq === 'One-off') return '--';
  //   const d = new Date(start);
  //   const now = new Date();
  //   while (d < now) {
  //     if (freq === 'Weekly') d.setDate(d.getDate() + 7);
  //     else if (freq === 'Monthly') d.setMonth(d.getMonth() + 1);
  //     else if (freq === 'Every 2 months') d.setMonth(d.getMonth() + 2);
  //     else if (freq === 'Quarterly') d.setMonth(d.getMonth() + 3);
  //     else if (freq === 'Annual') d.setFullYear(d.getFullYear() + 1);
  //     else break;
  //   }
  //   return d.toLocaleDateString('en-CA');
  // }

  onSelectChange(contract: Contract, event: any) {
    const action = event.target.value;
    if (action === 'view') {
      this.openDetails(contract);
    } else if (action === 'delete') {
      if(confirm('Are you sure you want to delete this contract?')) {
        this.resourceService.delete('Contracts', contract.id).subscribe(() => this.loadContracts());
      }
    } else if (action === 'approve') {
        this.resourceService.update('Contracts', contract.id + '/approve', {}).subscribe(() => {
            contract.Status = 'Approved';
            alert('Contract Approved');
            this.loadContracts();
        });
    } else if (action === 'reject') {
        this.resourceService.update('Contracts', contract.id + '/reject', {}).subscribe(() => {
            contract.Status = 'Rejected';
            alert('Contract Rejected');
            this.loadContracts();
        });
    }
    event.target.value = '';
  }

  toggleAll() {
    this.contracts.forEach(c => c.selected = this.allSelected);
    this.selectedCount = this.contracts.filter(c => c.selected).length;
  }

  updateAllSelected() {
    this.allSelected = this.contracts.every(c => c.selected);
    this.selectedCount = this.contracts.filter(c => c.selected).length;
  }

  openDetails(item: any) {
    this.selected = item;
    this.showDetails = true;
    window.scrollTo({ top: 0, behavior: 'smooth' });
    const c = item?.raw || item;
    if (c) {
      const mapped: Contract = {
        id: c.id,
        selected: false,
        Title: c.title || item?.Title || 'Untitled Contract',
        Type: c.type || item?.Type || 'Standard',
        Status: c.status || item?.Status || 'Draft',
        Value: c.value ?? item?.Value ?? 0,
        StartDate: c.startDate ? new Date(c.startDate).toLocaleDateString() : item?.StartDate || '',
        EndDate: c.endDate ? new Date(c.endDate).toLocaleDateString() : item?.EndDate || '',
        Client: c.clientName || item?.Client || 'Unknown Client',
        Project: c.projectName || item?.Project || 'No Project',
        Units: this.mapUnits(c.units || item?.Units),
        UnitsCount: Array.isArray(c.units) ? c.units.length : (item?.UnitsCount || 0),
        DaysLeft: item?.DaysLeft || this.calculateDaysLeft(c.endDate),
        Cycle: c.visitFrequency || item?.Cycle || 'One-off',
        NextBill: c.nextVisit ? new Date(c.nextVisit).toLocaleDateString('en-CA') : (item?.NextBill || '--'),
        Terms: c.terms ?? item?.Terms,
        raw: c,
      };
      this.selected = mapped;
      this.detailsPhotos = [];
      const p = c.photos;
      if (Array.isArray(p)) {
        this.detailsPhotos = p;
      } else if (typeof p === 'string' && p.trim() !== '') {
        try {
          const arr = JSON.parse(p);
          if (Array.isArray(arr)) this.detailsPhotos = arr.filter(x => typeof x === 'string');
        } catch {
          const arr = p.split(',').map(x => x.trim()).filter(x => x);
          this.detailsPhotos = arr;
        }
      }
    }
  }

  private calculateDaysLeft(endDate: string | null | undefined): string {
    if (!endDate) return 'Ongoing';
    const end = new Date(endDate);
    const diff = Math.ceil((end.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
    return diff > 0 ? `${diff}d` : 'Expired';
  }
  closeDetails() {
    this.selected = null;
    this.showDetails = false;
    document.body.style.overflow = 'auto';
  }
  get filteredContracts(): Contract[] {
    let list = this.contracts;
    if (this.searchText) {
      const low = this.searchText.toLowerCase();
      list = list.filter(c =>
        c.Title.toLowerCase().includes(low) ||
        c.Client.toLowerCase().includes(low) ||
        c.Project.toLowerCase().includes(low)
      );
    }
    this.activeFilters.forEach(f => {
      list = list.filter(c => String((c as any)[f.field]) === f.value);
    });
    return list;
  }

  get pagedContracts(): Contract[] {
    const start = (this.page - 1) * this.pageSize;
    return this.filteredContracts.slice(start, start + this.pageSize);
  }

  get totalPages(): number {
    return Math.ceil(this.filteredContracts.length / this.pageSize);
  }

  get visiblePages(): number[] {
    const pages: number[] = [];
    for (let i = 1; i <= this.totalPages; i++) pages.push(i);
    return pages;
  }

  setPage(p: number) {
    if (p >= 1 && p <= this.totalPages) this.page = p;
  }
  toggleFilterBuilder() {
    this.showFilterBuilder = !this.showFilterBuilder;
  }
  getFilterValues(field: string): string[] {
    if (!field) return [];
    const values = this.contracts
      .map(c => (c as any)[field])
      .filter(v => v !== undefined && v !== null && v !== '')
      .map(v => String(v));
    return Array.from(new Set(values));
  }
  applyQuickFilter(field: string, value: string) {
    if (!value) {
      this.activeFilters = this.activeFilters.filter(f => f.field !== field);
    } else {
      const existingIndex = this.activeFilters.findIndex(f => f.field === field);
      if (existingIndex > -1) {
        this.activeFilters[existingIndex].value = value;
      } else {
        this.activeFilters.push({ field, value });
      }
    }
    this.page = 1;
  }
  removeFilter(idx: number) {
    const removedFilter = this.activeFilters[idx];
    this.activeFilters.splice(idx, 1);
    if (removedFilter) {
      if (removedFilter.field === 'Client') this.quickClient = '';
      if (removedFilter.field === 'Project') this.quickProject = '';
      if (removedFilter.field === 'Type') this.quickType = '';
      if (removedFilter.field === 'Cycle') this.quickCycle = '';
      if (removedFilter.field === 'Status') this.quickStatus = '';
    }
    if (this.page > this.totalPages) this.page = this.totalPages;
  }
  clearAllFilters() {
    this.activeFilters = [];
    this.quickClient = '';
    this.quickProject = '';
    this.quickType = '';
    this.quickCycle = '';
    this.quickStatus = '';
    this.page = 1;
  }
  
//create new visit modal logic

 showCreate = false;
 savingContract: boolean = false;

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
  openInNewTab(url: string, name?: string) {
    const w = window.open('', '_blank');
    if (!w) return;
    const isPdf = url.startsWith('data:application/pdf') || /\.pdf($|\?)/i.test(url);
    const content = isPdf
      ? `<embed src="${url}" type="application/pdf" style="width:100%;height:95vh;">`
      : `<img src="${url}" style="max-width:100%;height:auto;">`;
    const download = `<a href="${url}" download="${name || 'download'}" style="margin:10px 0;display:inline-block;">Download</a>`;
    w.document.write(`<!doctype html><html><head><title>Preview</title></head><body>${content}<div>${download}</div></body></html>`);
    w.document.close();
  }
 addTask(newVisit: any) {
  if (this.savingContract) return;
  this.savingContract = true;

  const payload: any = {
    title: newVisit.Title || `${newVisit.ClientId} Contract`,
    type: newVisit.Type || 'AMC',
    projectId: newVisit.ProjectId,
    clientId: newVisit.ClientId,
    unitIds: newVisit.UnitIds || [],
    startDate: newVisit.Start
      ? new Date(newVisit.Start).toISOString()
      : new Date().toISOString(),
    endDate: newVisit.End
      ? new Date(newVisit.End).toISOString()
      : new Date().toISOString(),
    visitFrequency: newVisit.VisitFrequency || 'Monthly',
    billingFrequency: newVisit.BillingCycle || 'Monthly',
    value: Number(newVisit.AmountperCycle ?? 0) || 0,
    terms: newVisit.BillingCycle || '',
    photos: Array.isArray(newVisit.Photos)
      ? JSON.stringify(newVisit.Photos)
      : null,
    visitStartDate: newVisit.VisitStartDate
      ? new Date(newVisit.VisitStartDate).toISOString()
      : null,
    visitStartTime: newVisit.VisitStartTime
      ? newVisit.VisitStartTime + ':00'
      : null,
    numberOfVisits: Number(newVisit.NumberOfVisits) || 1
  };

  this.resourceService.create('Contracts', payload).subscribe({
    next: (res: any) => {

      this.loadContracts();

      this.toast.show(
        res?.message || 'Contract created successfully',
        'success'
      );

      this.showCreate = false;
      document.body.style.overflow = 'auto';
    },

    error: (err: any) => {

      const message =
        err?.error?.message ||
        err?.error ||
        'Failed to create contract';

      console.error(err);

      this.toast.show(message, 'error');

      this.showCreate = false;
      document.body.style.overflow = 'auto';
    },

    complete: () => { this.savingContract = false; }
  });
}

}
