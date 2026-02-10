import { NgIf, NgFor, CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output, OnChanges, SimpleChanges } from '@angular/core';
import { ResourceService } from '../../../core/resource.service';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';

@Component({
  selector: 'app-project-details',
  imports: [NgIf, NgFor, CommonModule],
  templateUrl: './project-details.html',
  styleUrl: './project-details.css'
})
export class ProjectDetails implements OnChanges {
  detailsTab: 'Overview' | 'Scopes' | 'Unit' | 'Tasks' | 'Reports' | 'Billing' | 'File' = 'Overview';

  @Input() taskss!: any;
  @Output() close = new EventEmitter<void>();

  project: any = null;
  units: any[] = [];
  projectTasks: any[] = [];
  reports: any[] = [];
  invoices: any[] = [];
  scopes: any[] = [];
  projectFiles: string[] = [];
  projectImages: string[] = [];
  projectDocuments: string[] = [];
  monthlyTasks: { year: number; month: number; count: number }[] = [];

  constructor(private resource: ResourceService) {}

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['taskss'] && this.taskss) {
      this.fetchBundle();
    }
  }

  setTab(tab: 'Overview' | 'Scopes' | 'Unit' | 'Tasks' | 'Reports' | 'Billing' | 'File') {
    this.detailsTab = tab;
    // data already loaded via bundle
  }

  fetchBundle() {
    if (!this.taskss || (!this.taskss.id && !this.taskss.Project)) return;
    const projectId = this.taskss.id;
    this.resource.getById('Projects', `${projectId}/bundle`).subscribe({
      next: (bundle) => {
        this.project = bundle?.project || null;
        this.units = bundle?.units || [];
        this.projectTasks = bundle?.tasks || [];
        this.monthlyTasks = Array.isArray(bundle?.monthlyTasks)
          ? bundle.monthlyTasks.map((x: any) => ({ year: x.year, month: x.month, count: x.count }))
          : [];
        this.reports = bundle?.reports || [];
        this.invoices = bundle?.invoices || [];
        this.scopes = bundle?.contracts || [];
        const fromBundleImages = Array.isArray(bundle?.projectImages) ? bundle.projectImages : null;
        const fromBundleDocs = Array.isArray(bundle?.projectFiles) ? bundle.projectFiles : null;
        if (fromBundleImages || fromBundleDocs) {
          this.projectImages = fromBundleImages ?? [];
          this.projectDocuments = fromBundleDocs ?? [];
          this.projectFiles = [...this.projectImages, ...this.projectDocuments];
        } else {
          const aggregated = this.aggregateFiles();
          this.projectImages = aggregated.images;
          this.projectDocuments = aggregated.docs;
          this.projectFiles = [...this.projectImages, ...this.projectDocuments];
        }
      },
      error: () => {
        this.units = [];
        this.projectTasks = [];
        this.monthlyTasks = [];
        this.reports = [];
        this.invoices = [];
        this.scopes = [];
        this.projectImages = [];
        this.projectDocuments = [];
        this.projectFiles = [];
      }
    });
  }

  doClose() {
    this.close.emit();
  }

  private normalizeList(files: any): string[] {
    if (!files) return [];
    try {
      const parsed = typeof files === 'string' ? JSON.parse(files) : files;
      if (Array.isArray(parsed)) {
        return parsed.map(x => (typeof x === 'string' ? x : String(x))).map(s => s.trim()).filter(s => s.length > 0);
      }
    } catch {}
    if (typeof files === 'string') {
      return files.split(/[;,\\n]/).map(s => s.trim()).filter(s => s.length > 0);
    }
    return [];
  }

  private isImageUrl(s: string): boolean {
    return typeof s === 'string' && (s.startsWith('data:image') || /\.(png|jpg|jpeg|gif|webp)$/i.test(s));
  }

  private aggregateFiles(): { images: string[]; docs: string[] } {
    const set = new Set<string>();
    const addAll = (arr: string[]) => arr.forEach(x => { if (x) set.add(x); });

    addAll(this.normalizeList(this.project?.Files || this.project?.files));
    addAll(this.normalizeList(this.project?.BOQShopDrawing || this.project?.boqShopDrawing));
    this.units.forEach(u => addAll(this.normalizeList(u?.Photos || u?.photos)));
    this.reports.forEach(r => addAll(this.normalizeList(r?.Photos || r?.photos)));
    this.scopes.forEach(c => addAll(this.normalizeList(c?.Photos || c?.photos)));

    const all = Array.from(set);
    const images = all.filter(x => this.isImageUrl(x));
    const docs = all.filter(x => !this.isImageUrl(x));
    return { images, docs };
  }

  displayFileName(s: string): string {
    if (!s) return '';
    const idx = Math.max(s.lastIndexOf('/'), s.lastIndexOf('\\'));
    if (idx >= 0 && idx < s.length - 1) return s.substring(idx + 1);
    if (s.startsWith('data:')) return 'inline-data';
    return s;
  }
}
