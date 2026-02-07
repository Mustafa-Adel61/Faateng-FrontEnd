import { HttpClient } from '@angular/common/http';
import { Technician } from './../technician/technician';
import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Output, OnInit, Input } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { UnitService, Unit } from '../../../core/unit.service';
import { ResourceService } from '../../../core/resource.service';
import * as L from 'leaflet';
declare const google: any;

@Component({
  selector: 'app-create-new-visit',
  imports: [CommonModule, FormsModule],
  templateUrl: './create-new-visit.html',
  styleUrl: './create-new-visit.css'
})
export class CreateNewVisit implements OnInit {
  @Input() serviceRequest: any = null; // Input from Service Request
  @Output() close = new EventEmitter<void>();
  @Output() save = new EventEmitter<any>();

  constructor(private unitService: UnitService, private http: HttpClient, private resource: ResourceService) { }

  // أي step حالياً؟ 1 = form1, 2 = form2 (date/time), 3 = review
  step: 1 | 2 | 3 = 1;

  showDatePicker: boolean = false;
  // --------------------------- الإضافات الجديدة ---------------------------
  // بيانات من الـ API
  // projects = [] as string[];
  projects: { id: number; name: string }[] = [];

  units: Unit[] = [];
  locations = ['Damascus Blvd', 'Riyadh Street', 'Jeddah Gate'];
  // -----------------------------------------------------------------------


  form = {
    project: '',
    units: '' as any, // Will hold Unit ID
    address: '',
    due: '',        // التاريخ
    time: '',
    objective: '',
    priority: 'Low', // Added priority
    lat: '' as any,
    lng: '' as any,
    technicians: [] as { id: string, name: string }[] // تم التغيير إلى مصفوفة (Array)
  };

  addressQuery = '';
  addressSuggestions: { display_name: string; lat: string; lon: string }[] = [];
  showAddressDropdown = false;

  selectedTechnicianId: string = '';

  technicians = [] as { id: string, name: string }[];
  private gmap?: any;
  private gmarker?: any;
  private autocomplete?: any;
  private lmap?: L.Map | null = null;
  private lmarker?: L.Marker | null = null;
  useGoogle = false;


  ngOnInit() {
    this.unitService.getAll().subscribe(data => {
      this.units = data;
    });
    this.resource.getAll('Projects').subscribe({
      next: (items) => {
        this.projects = (items || []).map((p: any) => ({
          id: p.id,
          name: p.name ?? p.projectName
        }));
      },
      error: () => this.projects = []
    });

    this.resource.getAll('Auth/technicians').subscribe({
      next: (items) => this.technicians = (items || []).map((t: any) => ({
        id: t.id,
        name: t.name || t.email || t.id
      })),
      error: () => this.technicians = []
    });

    // Pre-fill from Service Request if available
    if (this.serviceRequest) {
      this.form.units = this.serviceRequest.unitId || this.serviceRequest.unitName; // Best guess
      this.form.objective = this.serviceRequest.description || '';
      this.form.due = this.serviceRequest.preferredTime ? this.serviceRequest.preferredTime.split('T')[0] : '';
      // Address needs to be fetched or passed. 
      // If unitId matches a unit in this.units, we can get address.
      // But units are fetched async, so we might need to wait or do it in subscribe.
    }

    const key = localStorage.getItem('gmaps_api_key');
    if (key) {
      this.loadGoogleMaps().then(() => {
        this.useGoogle = !!((window as any).google && (window as any).google.maps);
        if (this.useGoogle) this.initGMap(); else this.initLeaflet();
      });
    } else {
      this.useGoogle = false;
      this.initLeaflet();
    }
  }


  // فتح form2 من داخل form1 (للتاريخ)
  openDateForm() {
    this.step = 2;
  }
  // دالة فتح الـ Date Picker
  openDatePicker() {
    this.showDatePicker = true;
  }
  // دالة لتحديث التاريخ من الـ Date Picker مباشرة
  // هنا سنقوم بمحاكاة تحديث القيمة من الـ date input المخفي
  selectDate(event: Event) {
    const input = event.target as HTMLInputElement;
    this.form.due = input.value;
    this.showDatePicker = false; // إخفاء الـ Date Picker بعد الاختيار
  }


  // حفظ بيانات التاريخ من form2 → رجوع لـ form1
  saveDateForm() {
    this.step = 1;
  }

  // فتح review form
  submitted = false;
  openReview() {
    this.submitted = true;
    if (!this.form.project ||
      !this.form.address) {
      return; // ❌ يمنع الحفظ
    }
    this.step = 3;
  }

  doClose() {
    this.close.emit();
  }

  doSaveFinal(_data: any) {
    this.save.emit({ ...this.form });
  }

  forceDatePicker(event: Event) {
    const target = event.target as HTMLInputElement;
    // التأكد أن الدالة موجودة قبل استدعائها
    if (target.showPicker) {
      target.showPicker();
    }
  }

  // دالة لإضافة الفني المختار من الـ Dropdown إلى المصفوفة
  addTechnician() {
    if (!this.selectedTechnicianId) return;
    const t = this.technicians.find(x => x.id === this.selectedTechnicianId);
    if (!t) return;
    if (!this.form.technicians.some(x => x.id === t.id)) {
      this.form.technicians.push({ id: t.id, name: t.name });
    }
    this.selectedTechnicianId = '';
  }

  // دالة لحذف فني من المصفوفة عند الضغط على الـ X
  removeTechnician(technician: { id: string, name: string }) {
    const index = this.form.technicians.findIndex(c => c.id === technician.id);
    if (index > -1) {
      this.form.technicians.splice(index, 1);
    }
  }
  isTechSelected(id: string): boolean {
    return this.form.technicians.some(x => x.id === id);
  }


  // دالة العودة للتعديل (العودة إلى الخطوة 1)
  editVisit() {
    this.step = 1;
  }

  // دالة مسح كل بيانات الزيارة (Reset Form)
  clearVisit() {
    // إعادة تعيين الـ Form إلى القيم الافتراضية
    this.form = {
      project: '',
      units: '',
      address: '',
      priority: '',
      due: '',
      time: '',
      objective: '',
      lat: '',
      lng: '',
      technicians: [] as { id: string, name: string }[]
    };

    // إغلاق الـ Modal أو العودة للخطوة 1 الفارغة
    this.step = 1;
  }
  get selectedTechnicianDisplay(): string {
    if (!this.selectedTechnicianId) return '';
    const t = this.technicians.find(x => x.id === this.selectedTechnicianId);
    if (!t) return this.selectedTechnicianId;
    return t.name || this.selectedTechnicianId;
  }
  getTechniciansLabel(): string {
    return this.form.technicians.map(t => t.name || t.id).join(', ');
  }

  onAddressInput() {
    if (this.useGoogle) return;
    this.showAddressDropdown = true;
    const q = (this.form.address || '').trim();
    if (q.length < 3) {
      this.addressSuggestions = [];
      return;
    }
    const url = `https://nominatim.openstreetmap.org/search?format=json&limit=6&q=${encodeURIComponent(q)}`;
    this.http.get<any[]>(url).subscribe(res => {
      this.addressSuggestions = res || [];
    });
  }

  selectSuggestion(s: { display_name: string; lat: string; lon: string }) {
    if (this.useGoogle) return;
    this.form.address = s.display_name;
    this.form.lat = parseFloat(s.lat);
    this.form.lng = parseFloat(s.lon);
    this.addressQuery = s.display_name;
    this.showAddressDropdown = false;
    this.updateLeafletMarker(Number(this.form.lat), Number(this.form.lng), this.form.address);
  }

  private async loadGoogleMaps(): Promise<void> {
    if ((window as any).google && (window as any).google.maps) return;
    return new Promise<void>((resolve) => {
      const key = localStorage.getItem('gmaps_api_key');
      const url = `https://maps.googleapis.com/maps/api/js?key=${key || ''}&libraries=places`;
      const script = document.createElement('script');
      script.src = url;
      script.async = true;
      script.defer = true;
      script.onload = () => resolve();
      document.head.appendChild(script);
    });
  }

  private initGMap() {
    const mapEl = document.getElementById('cnv-map');
    const inputEl = document.getElementById('gmap-autocomplete') as HTMLInputElement | null;
    if (!mapEl) return;
    this.gmap = new google.maps.Map(mapEl, {
      center: { lat: 33.5138, lng: 36.2165 },
      zoom: 12,
      mapTypeId: 'roadmap'
    });
    if (inputEl) {
      this.autocomplete = new google.maps.places.Autocomplete(inputEl, {
        fields: ['formatted_address', 'geometry'],
        types: ['geocode']
      });
      this.autocomplete.addListener('place_changed', () => {
        const place = this.autocomplete.getPlace();
        if (!place || !place.geometry) return;
        const loc = place.geometry.location;
        const lat = loc.lat();
        const lng = loc.lng();
        this.form.address = place.formatted_address || inputEl.value || '';
        this.form.lat = lat;
        this.form.lng = lng;
        this.updateGMarker(lat, lng, this.form.address);
      });
    }
    if (this.form.lat && this.form.lng) {
      this.updateGMarker(Number(this.form.lat), Number(this.form.lng), this.form.address);
    }
  }

  private updateGMarker(lat: number, lng: number, label?: string) {
    if (!this.gmap) return;
    if (this.gmarker) {
      this.gmarker.setPosition({ lat, lng });
    } else {
      this.gmarker = new google.maps.Marker({
        position: { lat, lng },
        map: this.gmap
      });
    }
    if (label) {
      const infowindow = new google.maps.InfoWindow({ content: label });
      infowindow.open(this.gmap, this.gmarker);
    }
    this.gmap.setCenter({ lat, lng });
    this.gmap.setZoom(Math.max(this.gmap.getZoom(), 13));
  }

  private initLeaflet() {
    const el = document.getElementById('cnv-map');
    if (!el) return;
    if (this.lmap) return;
    this.lmap = L.map('cnv-map', { zoomControl: true }).setView([33.5138, 36.2165], 12);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '© OpenStreetMap'
    }).addTo(this.lmap);
    if (this.form.lat && this.form.lng) {
      this.updateLeafletMarker(Number(this.form.lat), Number(this.form.lng), this.form.address);
    }
  }

  private updateLeafletMarker(lat: number, lng: number, label?: string) {
    if (!this.lmap) this.initLeaflet();
    if (!this.lmap) return;
    const icon = L.icon({
      iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
      shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
      iconAnchor: [12, 41],
      popupAnchor: [1, -34],
      shadowSize: [41, 41]
    });
    if (this.lmarker) {
      this.lmarker.setLatLng([lat, lng]);
    } else {
      this.lmarker = L.marker([lat, lng], { icon }).addTo(this.lmap);
    }
    if (label) this.lmarker.bindPopup(label).openPopup();
    this.lmap.setView([lat, lng], Math.max(this.lmap.getZoom(), 13));
  }

  onProjectChange(projectId: number) {
    if (!projectId) {
      this.unitService.getAll().subscribe(data => this.units = data);
      this.form.address = '';
      this.form.lat = '';
      this.form.lng = '';
      this.addressQuery = '';
      return;
    }
    this.unitService.getByProject(Number(projectId)).subscribe(data => {
      this.units = data;
      this.form.units = '';
    });
    this.resource.getById('Projects', Number(projectId)).subscribe({
      next: (p: any) => {
        const addr = p?.siteAddress || p?.location || this.form.address;
        this.form.address = addr;
        this.addressQuery = addr;
        this.form.lat = p?.siteLat ?? this.form.lat;
        this.form.lng = p?.siteLng ?? this.form.lng;
        const lat = Number(this.form.lat);
        const lng = Number(this.form.lng);
        if (!Number.isNaN(lat) && !Number.isNaN(lng)) {
          if (this.useGoogle) {
            this.updateGMarker(lat, lng, this.form.address);
          } else {
            this.updateLeafletMarker(lat, lng, this.form.address);
          }
        }
      },
      error: () => {}
    });
  }

  onUnitChange(unitId: any) {
    const id = Number(unitId);
    if (!id || Number.isNaN(id)) return;
    this.resource.getById('Units', id).subscribe({
      next: (u: any) => {
        const addr = u?.project?.siteAddress || u?.client?.address || this.form.address;
        this.form.address = addr;
        this.addressQuery = addr;
        if (u?.lat != null && u?.lng != null) {
          this.form.lat = u.lat;
          this.form.lng = u.lng;
          const lat = Number(this.form.lat);
          const lng = Number(this.form.lng);
          if (!Number.isNaN(lat) && !Number.isNaN(lng)) {
            if (this.useGoogle) {
              this.updateGMarker(lat, lng, this.form.address);
            } else {
              this.updateLeafletMarker(lat, lng, this.form.address);
            }
          }
        }
      },
      error: () => {}
    });
  }
}
