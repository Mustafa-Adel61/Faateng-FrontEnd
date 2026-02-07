import { NgFor } from '@angular/common';
import { Component, AfterViewInit } from '@angular/core';
import { TaskService, TaskItem } from '../../../core/task.service';
import * as L from 'leaflet';
import { SharedTaskDetails } from '../../../Shared/shared-components/shared-task-details/shared-task-details';

@Component({
  selector: 'app-map',
  standalone: true,
  imports: [NgFor, SharedTaskDetails],
  template: `
    <div class="map-container">
      <div id="map"></div>
      <div class="map-caption">{{ caption }}</div>
    </div>
    <div class="tasks-list">
      <div
        class="task-item"
        *ngFor="let t of tasks"
        (click)="focusTask(t)"
      >
        <div class="task-title">{{ t.title }}</div>
        <div class="task-sub">
          {{ t.unit?.model }} ({{ t.unit?.serial }}) • {{ t.unit?.client?.address || '' }}
        </div>
      </div>
    </div>
    <div class="details" *ngIf="selected">
      <h4>{{ selected?.title }}</h4>
      <div><strong>Unit:</strong> {{ selected?.unit?.model }} ({{ selected?.unit?.serial }})</div>
      <div><strong>Address:</strong> {{ selected?.unit?.client?.address || '' }}</div>
      <div><strong>Assignee:</strong> {{ selected?.assigneeUser?.fullName || selected?.assigneeUser?.email || selected?.assigneeUserId || '' }}</div>
      <div><strong>Status:</strong> {{ selected?.status }}</div>
      <div><strong>Schedule:</strong> {{ selected?.scheduledStart }} - {{ selected?.scheduledEnd }}</div>
    </div>
    <app-shared-task-details
      [visible]="!!selected"
      [task]="selectedTaskView"
      [statuses]="statuses"
      (close)="selected=null"
      (changeStatus)="onDetailsChangeStatus()"
    ></app-shared-task-details>
  `,
  styles: [`
    .map-container { background: #fff; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.04); padding: 1rem; }
    .map-caption { background: #ffe066; color: #222; padding: 1rem; border-radius: 0 0 8px 8px; margin-top: 1rem; font-weight: 500; }
    #map { width: 100%; height: 700px; border-radius: 8px; }
    .tasks-list { margin-top: 1rem; display: grid; gap: 8px; }
    .task-item { padding: 8px; border: 1px solid #eee; border-radius: 6px; cursor: pointer; }
    .task-item:hover { background: #fafafa; }
    .task-title { font-weight: 600; }
    .task-sub { color: #666; font-size: 13px; }
    .details { margin-top: 1rem; padding: 12px; border: 1px solid #ddd; border-radius: 6px; }
  `]
})
export class MapComponent implements AfterViewInit {
  mapUrl = 'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3330.857282246978!2d36.27652731518744!3d33.5138079807516!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x1518e75e1b2b1b2b%3A0x7d0b0b0b0b0b0b0b!2sDamascus!5e0!3m2!1sen!2ssy!4v1660000000000!5m2!1sen!2ssy';
  caption = 'Damascus Boulevard\nAddress: Building A1 - UNIT#HW • Oil & Grease';
  tasks: TaskItem[] = [];
  selected: TaskItem | null = null;
  statuses = ['Scheduled', 'Dispatched', 'On-Site', 'Waiting-Parts', 'Backlog', 'QA/Review', 'Done', 'Closed'];

  private map?: L.Map;
  private markers: L.Marker[] = [];


  constructor(private taskService: TaskService) {
    const minLat = -90, maxLat = 90, minLng = -180, maxLng = 180;
    this.taskService.map(minLat, maxLat, minLng, maxLng).subscribe(items => {
      this.tasks = items;
      const firstWithCoords = this.tasks.find(x => x.lat && x.lng);
      if (firstWithCoords) {
        // this.focusTask(firstWithCoords);
        this.renderMarkers();
      }
    });
  }

  ngAfterViewInit(): void {
    this.map = L.map('map', { zoomControl: true }).setView([33.5138, 36.2165], 12);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '© OpenStreetMap'
    }).addTo(this.map);
    this.renderMarkers();
  }

  get selectedTaskView(): any {
    if (!this.selected) return null;
    const s = this.selected;
    return {
      name: s.title,
      status: s.status,
      slaStatus: 'OK',
      priority: s.priority,
      team: s.unit?.client?.name || 'Ops',
      units: s.unit ? `${s.unit.model} (${s.unit.serial})` : '',
      address: (s as any)?.locationName || s.unit?.project?.siteAddress || s.unit?.client?.address || '',
      due: s.scheduledEnd || '',
      slaDue: s.scheduledEnd || '',
      objective: s.description || '',
      assignee: s.assigneeUser?.fullName || s.assigneeUser?.email || s.assigneeUserId || ''
    };
  }

  private renderMarkers() {
    if (!this.map) return;
    this.markers.forEach(m => m.remove());
    this.markers = [];
    for (const t of this.tasks.filter(x => x.lat && x.lng)) {
      const marker = L.marker([t.lat!, t.lng!], {
        icon: L.icon({
          iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
          shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
          iconAnchor: [12, 41],
          popupAnchor: [1, -34],
          shadowSize: [41, 41]
        })
      }).addTo(this.map!);
      marker.on('click', () => this.focusTask(t));
      const addr = (t as any)?.locationName || t.unit?.project?.siteAddress || t.unit?.client?.address || '';
      marker.bindPopup(`<b>${t.title}</b><br/>${t.unit?.model} (${t.unit?.serial})<br/>${addr}`);
      this.markers.push(marker);
    }
    if (this.markers.length) {
      const group = L.featureGroup(this.markers);
      this.map.fitBounds(group.getBounds().pad(0.25));
    }
  }

  focusTask(t: TaskItem) {
    const lat = t.lat, lng = t.lng;
    const unitText = t.unit ? `${t.unit.model} (${t.unit.serial})` : '';
    const address = (t as any)?.locationName || t.unit?.project?.siteAddress || t.unit?.client?.address || '';
    this.caption = `${unitText}\nAddress: ${address} • ${t.title}`;
    this.selected = t;
    if (lat != null && lng != null) {
      if (this.map) {
        this.map.setView([lat, lng], Math.max(this.map.getZoom(), 13));
      } else {
        this.mapUrl = `https://maps.google.com/maps?q=${lat},${lng}&z=13&output=embed`;
      }
    }
  }

  onDetailsChangeStatus() {
    if (!this.selected) return;
    this.taskService.updateStatus(this.selected.id, this.selected.status).subscribe();
  }
}