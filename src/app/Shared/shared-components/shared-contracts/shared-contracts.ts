import { Component, Input, OnInit } from '@angular/core';
import { CommonModule, NgFor, NgIf } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ResourceService } from '../../../core/resource.service';
import { SharedPageHeader } from '../../shared-layout/shared-page-header/shared-page-header';
import { CreateNewContact } from "../../../admin/pages/create-new-contact/create-new-contact";

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
  Terms?: string;
  raw?: any;
}

@Component({
  selector: 'app-shared-contracts',
  standalone: true,
  imports: [CommonModule, FormsModule, NgIf, NgFor, SharedPageHeader, CreateNewContact],
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
  newFilter = { field: '', value: '' };
  activeFilters: { field: string; value: string }[] = [];
  selectedCount = 0;
  // Pagination
  page = 1;
  pageSize = 10;

  constructor(private resourceService: ResourceService) {}

  ngOnInit(): void {
    this.loadContracts();
  }

  loadContracts() {
    this.resourceService.getAll('Contracts').subscribe({
      next: (items: any[]) => {
        this.contracts = items.map(c => ({
          id: c.id,
          selected: false,
          Title: c.title || 'Untitled Contract',
          Type: c.type || 'Standard',
          Status: c.status || 'Draft',
          Value: c.value || 0,
          StartDate: c.startDate ? new Date(c.startDate).toLocaleDateString() : '',
          EndDate: c.endDate ? new Date(c.endDate).toLocaleDateString() : '',
          Client: c.clientName || 'Unknown Client',
          Units: c.units ? c.units.map((u: any) => u.type).join(', ') : 'No Units',
          Terms: c.terms,
          raw: c
        }));
        this.totalCount = items.length;
        this.approvedCount = items.filter(c => c.status === 'Approved').length;
        this.rejectedCount = items.filter(c => c.status === 'Rejected').length;
        this.activeCount = items.filter(c => (c.status || '').toLowerCase() === 'active').length;
        this.totalValue = items.reduce((sum, c) => sum + (Number(c.value) || 0), 0);
      },
      error: (err) => {
        console.error('Failed to load contracts', err);
      }
    });
  }

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
    document.body.style.overflow = 'hidden';
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
        Terms: c.terms ?? item?.Terms,
        raw: c
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
  closeDetails() {
    this.selected = null;
    this.showDetails = false;
    document.body.style.overflow = 'auto';
  }
  get filteredContracts(): Contract[] {
    let result = this.contracts;
    if (this.activeFilters.length) {
      result = result.filter(c =>
        this.activeFilters.every(f => {
          const v = (c as any)[f.field];
          if (v == null) return false;
          return String(v).toLowerCase() === String(f.value).toLowerCase();
        })
      );
    }
    if (this.searchText.trim() !== '') {
      const search = this.searchText.toLowerCase();
      result = result.filter(c =>
        (c.Title?.toLowerCase().includes(search)) ||
        (c.Client?.toLowerCase().includes(search)) ||
        (c.Type?.toLowerCase().includes(search)) ||
        (c.Status?.toLowerCase().includes(search))
      );
    }
    return result;
  }
  get totalPages(): number {
    return Math.max(1, Math.ceil(this.filteredContracts.length / this.pageSize));
  }
  get pagedContracts(): Contract[] {
    const start = (this.page - 1) * this.pageSize;
    console.log(this.filteredContracts);
    
    return this.filteredContracts.slice(start, start + this.pageSize);
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
  toggleFilterBuilder() {
    this.showFilterBuilder = !this.showFilterBuilder;
    this.newFilter = { field: '', value: '' };
  }
  getFilterValues(field: string): string[] {
    if (!field) return [];
    const values = this.contracts
      .map(c => (c as any)[field])
      .filter(v => v !== undefined && v !== null)
      .map(v => String(v));
    return Array.from(new Set(values));
  }
  applyFilter() {
    if (!this.newFilter.field || !this.newFilter.value) return;
    this.activeFilters.push({ ...this.newFilter });
    this.newFilter = { field: '', value: '' };
    this.showFilterBuilder = false;
    this.page = 1;
  }
  removeFilter(idx: number) {
    this.activeFilters.splice(idx, 1);
    if (this.page > this.totalPages) this.page = this.totalPages;
  }
  clearAllFilters() {
    this.activeFilters = [];
    this.page = 1;
  }
  
//create new visit modal logic

 showCreate = false;

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
    const payload: any = {
      title: newVisit.Title || `${newVisit.ClientId} Contract`,
      type: newVisit.Type || 'AMC',
      projectId: newVisit.ProjectId,
      clientId: newVisit.ClientId,
      unitIds: newVisit.UnitIds || [],
      startDate: newVisit.Start ? new Date(newVisit.Start).toISOString() : new Date().toISOString(),
      endDate: newVisit.End ? new Date(newVisit.End).toISOString() : new Date().toISOString(),
      visitFrequency: newVisit.BillingCycle || 'Monthly',
      value: Number(newVisit.AmountperCycle ?? 0) || 0,
      terms: newVisit.BillingCycle || '',
      photos: Array.isArray(newVisit.Photos) ? JSON.stringify(newVisit.Photos) : null
    };
    this.resourceService.create('Contracts', payload).subscribe({
      next: () => {
        this.loadContracts();
        this.showCreate = false;
        document.body.style.overflow = 'auto';
      },
      error: () => {
        this.loadContracts();
        this.showCreate = false;
        document.body.style.overflow = 'auto';
      }
    });
 }

}
