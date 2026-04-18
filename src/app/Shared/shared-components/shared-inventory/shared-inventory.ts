import { SharedPageHeader } from './../../shared-layout/shared-page-header/shared-page-header';
import { NgClass, NgFor, NgIf, CommonModule } from '@angular/common';
import { Component, Input, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { InventoryService, InventoryItem } from '../../../core/inventory.service';
import { Loading } from '../loading/loading';
import { ToastService } from '../../services/toast.service';

@Component({
  selector: 'app-shared-inventory',
  standalone: true,
  imports: [FormsModule, NgFor, NgIf, NgClass, SharedPageHeader, CommonModule, Loading],
  templateUrl: './shared-inventory.html',
  styleUrl: './shared-inventory.css'
})
export class SharedInventory implements OnInit {
  @Input() role: 'admin' | 'dispatcher' | 'manager' | 'technician' | 'client' | null = null;

  items: InventoryItem[] = [];
  filteredItems: InventoryItem[] = [];
  
  // Pagination
  page = 1;
  pageSize = 10;
  
  // Selection
  allSelected = false;

  // Edit Modal
  showEditModal = false;
  selectedItem: InventoryItem | null = null;
  loading = false;
  private toast = inject(ToastService);

  constructor(private inventoryService: InventoryService) {}

  ngOnInit() {
    this.loadItems();
  }

  loadItems() {
    this.loading = true;
    this.inventoryService.getAll().subscribe({
      next: (data) => {
        this.items = data;
        this.filteredItems = data;
        this.loading = false;
      },
      error: (err) => {
        console.error(err);
        this.loading = false;
      }
    });
  }

  get pagedItems() {
    const start = (this.page - 1) * this.pageSize;
    return this.filteredItems.slice(start, start + this.pageSize);
  }

  get totalPages() {
    return Math.ceil(this.filteredItems.length / this.pageSize);
  }

  get visiblePages(): number[] {
    const pages: number[] = [];
    const maxButtons = 5;
    let startPage = Math.max(1, this.page - Math.floor(maxButtons / 2));
    let endPage = Math.min(this.totalPages, startPage + maxButtons - 1);
    
    if (endPage - startPage + 1 < maxButtons) {
      startPage = Math.max(1, endPage - maxButtons + 1);
    }

    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }
    return pages;
  }

  setPage(p: number) {
    if (p >= 1 && p <= this.totalPages) {
      this.page = p;
    }
  }

  toggleAll() {
    // Implement if needed, currently InventoryItem doesn't have 'selected' property in interface
    // We can extend it locally if needed
  }

  openDetails(item: InventoryItem) {
    // Clone to avoid direct mutation before save
    this.selectedItem = { ...item }; 
    this.showEditModal = true;
  }

  closeDetails() {
    this.showEditModal = false;
    this.selectedItem = null;
  }

  saveDetails() {
    if (!this.selectedItem) return;
    
    this.loading = true;
    this.inventoryService.update(this.selectedItem.id, this.selectedItem).subscribe({
      next: () => {
        this.toast.show('Item updated successfully', 'success');
        this.loadItems();
        this.closeDetails();
        this.loading = false;
      },
      error: (err) => {
        console.error(err);
        this.toast.show('Failed to update item', 'error');
        this.loading = false;
      }
    });
  }
}
