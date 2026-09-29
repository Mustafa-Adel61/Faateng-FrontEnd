import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { ResourceService } from '../../../core/resource.service';
import { SharedPageHeader } from '../../../Shared/shared-layout/shared-page-header/shared-page-header';
import { Loading } from '../../../Shared/shared-components/loading/loading';

interface OverviewData {
  metrics: {
    urgentTasks: number;
    urgentRequests: number;
    futureTasks: number;
    assetsWithIssues: number;
    pmCompliance: number;
    invoiceCount: number;
    outstanding: number;
  };
  attention: Array<{ kind: string; title: string; detail: string; date: string; projectName?: string }>;
  upcoming: Array<{ date: string; projectName: string; visit: string; units: string[] }>;
}

@Component({
  selector: 'app-client-overview',
  standalone: true,
  imports: [CommonModule, SharedPageHeader, Loading],
  templateUrl: './client-overview.html',
  styleUrl: './client-overview.css'
})
export class ClientOverview implements OnInit {
  loading = true;
  data: OverviewData | null = null;

  constructor(private resource: ResourceService) {}

  ngOnInit(): void {
    this.resource.getAll('client-overview').subscribe({
      next: response => {
        this.data = response as unknown as OverviewData;
        this.loading = false;
      },
      error: () => {
        this.data = null;
        this.loading = false;
      }
    });
  }

  formatDate(value: string): string {
    return value ? new Intl.DateTimeFormat('en-GB', { day: '2-digit', month: 'short' }).format(new Date(value)) : '-';
  }

  formatCurrency(value: number): string {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(value || 0);
  }
}
