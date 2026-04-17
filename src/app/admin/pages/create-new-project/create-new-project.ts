import { CommonModule, NgIf } from '@angular/common';
import { Component, ElementRef, EventEmitter, OnInit, Output, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { ResourceService } from '../../../core/resource.service';
import { UnitService } from '../../../core/unit.service';
import { Loading } from '../../../Shared/shared-components/loading/loading';

@Component({
  selector: 'app-create-new-project',
  imports: [FormsModule,CommonModule,NgIf,ReactiveFormsModule, Loading],
  templateUrl: './create-new-project.html',
  styleUrl: './create-new-project.css'
})
export class CreateNewProject implements OnInit {  
  @Output() close = new EventEmitter<void>();
  @Output() save = new EventEmitter<any>();

  step: number = 1;
  steps = [1, 2, 3]; 

  showDatePicker: boolean = false;
  isNewClient: boolean = false;
  
  // Contacts for step 3
  contacts: any[] = [{ name: '', title: '', phone: '', email: '', isPrimary: true }];

  selectedFile: File | null = null;
  fileContent: string | ArrayBuffer | null = null;
  maxFileSize = 5; // MB
  allowedFileTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 'application/pdf'];
  errorMessage = '';
  previewUrl: string | null = null;

  ProjectTypes = ['Modernization', 'Maintenance', 'Inspection'];
  clients: { id: string; name: string }[] = [];
  selectedClientId: string | null = null;

  form = {
    projectName: '',
    objective: '',
    ProjectType: '',
    files: [] as string[] ,
    contractFiles: [] as { name: string; type: string; url: string }[],
    siteAddress: '',
    siteLat: '' as any,
    siteLng: '' as any,
    siteAddressGoogleMapLocation: '',
    Notes_SpecialInstructio: '',
    unitType: '',
  };

  constructor(private resource: ResourceService, private unitService: UnitService) {}
  loading: boolean = false;
  private pendingLoads = 0;
  private markLoadingStart() { this.pendingLoads++; this.loading = true; }
  private markLoadingEnd() { this.pendingLoads = Math.max(0, this.pendingLoads - 1); if (this.pendingLoads === 0) this.loading = false; }

  ngOnInit(): void {
    this.loadClients();
    
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

  loadClients() {
    this.markLoadingStart();
    this.resource.getAll('Users/clients').subscribe({
      next: (list) => {
        this.clients = (list || []).map((c: any) => ({ id: c.id, name: c.name }));
      },
      error: () => {
        this.clients = [];
        this.selectedClientId = null;
      },
      complete: () => { this.markLoadingEnd(); }
    });
  }
 
 addressQuery: string = '';
 addressSuggestions: { display_name: string; lat: string; lon: string }[] = [];
 showAddressDropdown = false;
 useGoogle = false;
 private gmap?: any;
 private gmarker?: any;
 private autocomplete?: any;
 private lmap?: any;
 private lmarker?: any;

 toggleNewClient() {
    this.isNewClient = !this.isNewClient;
    if (this.isNewClient) {
      this.selectedClientId = null;
    }
 }

 onClientChange() {
    if (this.selectedClientId) {
      this.isNewClient = false;
    }
 }

  addContact() {
    this.contacts.push({ name: '', title: '', phone: '', email: '', isPrimary: false });
  }

  setPrimary(index: number) {
    this.contacts.forEach((c, i) => c.isPrimary = (i === index));
  }

  removeContact(index: number) {
    if (this.contacts.length > 1) {
      const removed = this.contacts.splice(index, 1)[0];
      if (removed.isPrimary) this.contacts[0].isPrimary = true;
    }
  }

  goBack() {
    if (this.step > 1) this.step--;
  }
  
  submitted = false;
  goNext() {
    this.submitted = true;
    if (this.step === 1) {
      if (!this.form.projectName || !this.form.ProjectType) return;
    } else if (this.step === 2) {
      if (!this.form.siteAddress) return;
    }
    
    if (this.step < 3) {
      this.step++;
      this.submitted = false;
    } else {
      this.doSaveFinal();
    }
  }

  doSaveFinal() {  
    if (!this.selectedClientId && !this.isNewClient) {
      this.submitted = true;
      return;
    }

    let payload: any = {
      name: this.form.projectName,
      description: this.form.objective || '',
      projectType: this.form.ProjectType,
      siteAddress: this.form.siteAddress,
      siteLat: this.form.siteLat,
      siteLng: this.form.siteLng,
      siteAddressGoogleMapLocation: this.form.siteAddressGoogleMapLocation,
      notesSpecialInstruction: this.form.Notes_SpecialInstructio,
      clientId: this.selectedClientId,
      startDate: new Date().toISOString(),
      status: 'Active'
    };

    if (this.isNewClient) {
      const primary = this.contacts.find(c => c.isPrimary) || this.contacts[0];
      payload.primeContactName = primary.name;
      payload.jobTitle = primary.title;
      payload.phoneNumber = primary.phone;
      payload.emailAddress = primary.email;
      
      const secondary = this.contacts.length > 1 ? this.contacts.find(c => !c.isPrimary) : null;
      payload.secondaryContact = secondary ? secondary.name : null;
      payload.emailAddress2 = secondary ? secondary.email : null;
    }

    this.loading = true;
    this.save.emit(payload);
  }

 onAddressInput() {
   if (this.useGoogle) return;
   this.showAddressDropdown = true;
   const q = (this.addressQuery || '').trim();
   if (q.length < 3) {
     this.addressSuggestions = [];
     return;
   }
   const url = `https://nominatim.openstreetmap.org/search?format=json&limit=6&q=${encodeURIComponent(q)}`;
   fetch(url).then(r => r.json()).then((res: any[]) => {
     this.addressSuggestions = res || [];
   });
 }

 selectSuggestion(s: { display_name: string; lat: string; lon: string }) {
   if (this.useGoogle) return;
   this.form.siteAddress = s.display_name;
   this.form.siteLat = parseFloat(s.lat);
   this.form.siteLng = parseFloat(s.lon);
   this.form.siteAddressGoogleMapLocation = `${this.form.siteLat},${this.form.siteLng}`;
   this.addressQuery = s.display_name;
   this.showAddressDropdown = false;
   this.updateLeafletMarker(Number(this.form.siteLat), Number(this.form.siteLng), this.form.siteAddress);
 }

 async loadGoogleMaps(): Promise<void> {
   if ((window as any).google && (window as any).google.maps) return;
   await new Promise<void>((resolve) => {
     const key = localStorage.getItem('gmaps_api_key') || '';
     const url = `https://maps.googleapis.com/maps/api/js?key=${key}&libraries=places`;
     const script = document.createElement('script');
     script.src = url;
     script.async = true;
     script.defer = true;
     script.onload = () => resolve();
     document.head.appendChild(script);
   });
 }

 initGMap() {
   const mapEl = document.getElementById('cnv-map');
   const inputEl = document.getElementById('gmap-autocomplete') as HTMLInputElement | null;
   if (!mapEl) return;
   this.gmap = (window as any).google ? new (window as any).google.maps.Map(mapEl, {
     center: { lat: 33.5138, lng: 36.2165 },
     zoom: 12,
     mapTypeId: 'roadmap'
   }) : null;
   if (inputEl && (window as any).google) {
     this.autocomplete = new (window as any).google.maps.places.Autocomplete(inputEl, {
       fields: ['formatted_address', 'geometry'],
       types: ['geocode']
     });
     this.autocomplete.addListener('place_changed', () => {
       const place = this.autocomplete.getPlace();
       if (!place || !place.geometry) return;
       const loc = place.geometry.location;
       const lat = loc.lat();
       const lng = loc.lng();
       this.form.siteAddress = place.formatted_address || inputEl.value || '';
       this.form.siteLat = lat;
       this.form.siteLng = lng;
       this.form.siteAddressGoogleMapLocation = `${lat},${lng}`;
       this.updateGMarker(lat, lng, this.form.siteAddress);
     });
   }
   if (this.form.siteLat && this.form.siteLng) {
     this.updateGMarker(Number(this.form.siteLat), Number(this.form.siteLng), this.form.siteAddress);
   }
 }

 updateGMarker(lat: number, lng: number, label?: string) {
   if (!this.gmap) return;
   if (this.gmarker) {
     this.gmarker.setPosition({ lat, lng });
   } else if ((window as any).google) {
     this.gmarker = new (window as any).google.maps.Marker({
       position: { lat, lng },
       map: this.gmap
     });
   }
   if (label && (window as any).google) {
     const infowindow = new (window as any).google.maps.InfoWindow({ content: label });
     infowindow.open(this.gmap, this.gmarker);
   }
   this.gmap.setCenter({ lat, lng });
   this.gmap.setZoom(Math.max(this.gmap.getZoom(), 13));
 }

 initLeaflet() {
   const el = document.getElementById('cnv-map');
   if (!el) return;
   if (this.lmap) return;
   const L = (window as any).L;
   if (!L) return;
   this.lmap = L.map('cnv-map', { zoomControl: true }).setView([33.5138, 36.2165], 12);
   L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
     maxZoom: 19,
     attribution: '© OpenStreetMap'
   }).addTo(this.lmap);
   if (this.form.siteLat && this.form.siteLng) {
     this.updateLeafletMarker(Number(this.form.siteLat), Number(this.form.siteLng), this.form.siteAddress);
   }
 }

 updateLeafletMarker(lat: number, lng: number, label?: string) {
   if (!this.lmap) this.initLeaflet();
   if (!this.lmap) return;
   const L = (window as any).L;
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
}
