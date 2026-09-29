import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { ResourceService } from '../../../core/resource.service';
import { Loading } from '../../../Shared/shared-components/loading/loading';

interface ClientDocument {
  id: number;
  name: string;
  category: string;
  relatedTo: string;
  building: string;
  date: string;
  url: string;
}

@Component({
  selector: 'app-client-documents',
  standalone: true,
  imports: [CommonModule, Loading],
  templateUrl: './documents.html',
  styleUrl: './documents.css'
})
export class Documents implements OnInit {
  private readonly resource = inject(ResourceService);
  documents: ClientDocument[] = [];
  loading = true;
  error = '';
  page = 1;
  pageSize = 10;

  get totalPages(): number {
    return Math.max(1, Math.ceil(this.documents.length / this.pageSize));
  }

  get pagedDocuments(): ClientDocument[] {
    const start = (this.page - 1) * this.pageSize;
    return this.documents.slice(start, start + this.pageSize);
  }

  get visiblePages(): number[] {
    const pages: number[] = [];
    const maxButtons = 5;
    if (this.totalPages <= maxButtons) {
      for (let i = 1; i <= this.totalPages; i++) pages.push(i);
      return pages;
    }
    let start = Math.max(1, this.page - 2);
    let end = Math.min(this.totalPages, start + maxButtons - 1);
    if (end === this.totalPages) start = Math.max(1, end - maxButtons + 1);
    for (let i = start; i <= end; i++) pages.push(i);
    return pages;
  }

  setPage(page: number): void {
    if (page >= 1 && page <= this.totalPages) this.page = page;
  }

  get contractsCount(): number {
    return this.documents.filter(document => document.category === 'Contract').length;
  }

  get maintenanceReportsCount(): number {
    return this.documents.filter(document => document.category === 'Maintenance Report').length;
  }

  get serviceReportsCount(): number {
    return this.documents.filter(document => document.category === 'Service Report').length;
  }

  get invoicesCount(): number {
    return this.documents.filter(document => document.category === 'Invoice').length;
  }

  ngOnInit(): void {
    this.resource.getAll('client-documents').subscribe({
      next: documents => {
        this.documents = (documents || []) as ClientDocument[];
        this.page = 1;
        this.loading = false;
      },
      error: () => {
        this.error = 'Documents could not be loaded.';
        this.loading = false;
      }
    });
  }

  formatDate(value: string): string {
    if (!value) return '-';
    const date = new Date(value);
    return Number.isNaN(date.getTime())
      ? '-'
      : new Intl.DateTimeFormat('en-GB', { day: '2-digit', month: 'short' }).format(date);
  }

  async download(document: ClientDocument): Promise<void> {
    try {
      const blob = this.dataUrlToBlob(document.url) || await this.fetchBlob(document.url);
      const objectUrl = URL.createObjectURL(blob);
      this.saveFile(objectUrl, document.name);
      setTimeout(() => URL.revokeObjectURL(objectUrl), 1000);
    } catch {
      if (!document.url.startsWith('data:')) {
        this.saveFile(document.url, document.name);
      }
    }
  }

  private async fetchBlob(url: string): Promise<Blob> {
    const response = await fetch(url);
    if (!response.ok) throw new Error('Download failed');
    return response.blob();
  }

  private dataUrlToBlob(url: string): Blob | null {
    if (!url.startsWith('data:')) return null;
    const comma = url.indexOf(',');
    if (comma < 0) return null;
    const header = url.slice(0, comma);
    const payload = url.slice(comma + 1);
    const mime = header.match(/^data:([^;]+)/i)?.[1] || 'application/octet-stream';
    if (header.toLowerCase().includes(';base64')) {
      const binary = atob(payload);
      const bytes = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
      return new Blob([bytes], { type: mime });
    }
    return new Blob([decodeURIComponent(payload)], { type: mime });
  }

  private saveFile(url: string, name: string): void {
    const link = window.document.createElement('a');
    link.href = url;
    link.download = name || 'document';
    link.target = '_blank';
    link.rel = 'noopener';
    link.click();
  }
}
