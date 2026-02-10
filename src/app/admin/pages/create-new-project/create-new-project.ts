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
  steps = [1, 2, 3, 4, 5];

  showDatePicker: boolean = false;

  selectedFile: File | null = null;
  fileContent: string | ArrayBuffer | null = null;
  maxFileSize = 5; // MB
allowedFileTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 'application/pdf'];
  errorMessage = '';
    previewUrl: string | null = null;

  // Units Data
  unitsList: any[] = [];
  selectedUnits: any[] = []; // { id, model, serial, price, quantityToUse, isSelected }
  // --------------------------- الإضافات الجديدة ---------------------------
  // بيانات ثابتة للـ Dropdowns
//   projects = ['Project Alpha', 'Project Beta', 'Project Gamma'];
//   units = ['Unit 1 (AC)', 'Unit 2 (Heaters)', 'Unit 3 (Boilers)']; 
//   locations = ['Damascus Blvd', 'Riyadh Street', 'Jeddah Gate'];
  // -----------------------------------------------------------------------
ProjectTypes = ['Residential', 'Commercial', 'Hotel','Government','Industrial'];
contractTypes = ['Full Coverage','Preventive Only','Emergency Only','Custom'];
paymentTerms = ['Monthly','Quarterly','Annual','Per Visit'];
regions=['Damascus','Aleppo','Homs'];
unitTypes=['Elevators','Escalators / Moving Walks','HVAC – Chillers','HVAC – Fujitsu VRF Systems','Fire Systems'];
doorTypes=['Automatic','Manual'];
types=['Passenger','Freight','Service'];
machineRooms=['Yes','No'];
modelOrBrands=['Fujitsu VRF','Fujitsu VRF','Fujitsu VRF'];
indoor_outdoors=['Indoor','Outdoor'];
handrailLightings=['Yes','No'];
Chillerstypes=['Air','Water'];
coolingTowerAttacheds=['Yes','No'];
controlTypes=['Centralized','Local'];
installationTypes=['Rooftop','Façade','Ground'];
hanrailLightings=['Yes','No'];
firePumpTypes=['Automatic','Manual'];

clients: { id: string; name: string }[] = [];
selectedClientId: string | null = null;
units: { id: number; label: string }[] = [];
selectedUnitIds: number[] = [];

form = {
    projectName: '',
    clientOrCompanyName: '',
    ProjectType: '',
    PrimeContactName: '',        
    jopTitle: '',
    phoneNumber: '',
    emailAddress : '',
    emailAddress2: '',
    secondryContact: '',
    contractStartDate: '',
    contractEndDate: '',
    maintenanceStartDate: '',
    contractDuration: '',
    contractType: '',
    paymentTerms: '',
    files: [] as string[] ,
    contractFiles: [] as { name: string; type: string; url: string }[],
    siteAddress: '',
    siteLat: '' as any,
    siteLng: '' as any,
    siteAddressGoogleMapLocation: '',
    region: '',
    regionGoogleMapLocation: '',
    onSiteContact: '',
    unitType: '',
    // Last Page
    BOQ_ShopDrawing: [] as string[] ,
    boqFiles: [] as { name: string; type: string; url: string }[],
    Notes_SpecialInstructio: '',

    //if unit type is Elevator
    numberOfElevators: '',
    doorType: '',
    type: '',
    machineRoom: '',
    numberOfStops: '',
    modelOrBrand: '',
    controllerType: '',
    serialNumber: '',
    notes: '',

    //if unit type is Escalators/MovingWalks
    numberOfEscalators: '',
    TravelHeight: '',
    indoor_outdoor: '',
    handrailLighting: '',
    EscalatorsBrandOrModel: '',
    EscalatorsSerialNumber: '',

    //if unit type is HVAC-Chillers
    numberOfChillers: '',
    Chillerstype: '',
    capacity: '',
    ChillerBrandOrModel: '',
    coolingTowerAttached: '',
    ChillerserialNumber: '',

    //if unit type is HVAC-Fujitsu VRF System
    numberOfOutdoorUnits: '',
    controlType: '',
    totalIndoorUnits: '',
    installationType: '',
    outdoorUnitCapacity: '',
    HVAC_FujitsuserialNumber: '',

    //if unit type is HVAC-FireSystem
    fireAlarmControlPanelBrandOrModel: '',
    hanrailLighting: '',
    numberOfZonesOrLoops: '',
    firePumpType: '',
    smokeDetectorsCallPoints: '',
    hoseCabinets_ExtinguishersCount: '',
    FireSystemCapacity: '',
    lastCivilDefenseApprovalDate: '',    
  };

  constructor(private resource: ResourceService, private unitService: UnitService) {}
  loading: boolean = false;
  private pendingLoads = 0;
  private markLoadingStart() { this.pendingLoads++; this.loading = true; }
  private markLoadingEnd() { this.pendingLoads = Math.max(0, this.pendingLoads - 1); if (this.pendingLoads === 0) this.loading = false; }

  ngOnInit(): void {
    this.loadUnits();
    this.loadDropdowns(); // Load dropdowns from DB
    
    // Load Clients
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

  // Load dropdowns from DB with fallback to hardcoded values
  loadDropdowns() {
    const lookups = [
      { key: 'ProjectTypes', target: 'ProjectTypes', default: ['Residential', 'Commercial', 'Hotel', 'Government', 'Industrial'] },
      { key: 'ContractTypes', target: 'contractTypes', default: ['Full Coverage', 'Preventive Only', 'Emergency Only', 'Custom'] },
      { key: 'PaymentTerms', target: 'paymentTerms', default: ['Monthly', 'Quarterly', 'Annual', 'Per Visit'] },
      { key: 'Regions', target: 'regions', default: ['Damascus', 'Aleppo', 'Homs'] },
      { key: 'UnitTypes', target: 'unitTypes', default: ['Elevators', 'Escalators / Moving Walks', 'HVAC – Chillers', 'HVAC – Fujitsu VRF Systems', 'Fire Systems'] },
      // Add other lookups as needed
    ];

    lookups.forEach(lookup => {
      this.markLoadingStart();
      this.resource.getAll(`Lookups/${lookup.key}`).subscribe({
        next: (data) => {
          if (data && data.length > 0) {
            (this as any)[lookup.target] = data.map((item: any) => item.name || item); // Assume item has name or is string
          } else {
             (this as any)[lookup.target] = lookup.default;
          }
        },
        error: () => {
          // Fallback to default if API fails
          (this as any)[lookup.target] = lookup.default;
        },
        complete: () => { this.markLoadingEnd(); }
      });
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

 onClientChange() {
    if (!this.selectedClientId) {
      this.units = [];
      this.selectedUnitIds = [];
      return;
    }
    this.markLoadingStart();
    this.resource.getAll(`Users/${this.selectedClientId}/units`).subscribe({
      next: (list) => {
        this.units = (list || []).map((u: any) => ({
          id: u.id,
          label: `${u.serial} - ${u.model}`
        }));
      },
      error: () => {
        this.units = [];
        this.selectedUnitIds = [];
      },
      complete: () => { this.markLoadingEnd(); }
    });
  }

 selectedTechnician: string = ''; 
    
  technicians = ['Technician 1', 'Technician 2', 'Technician 3', 'Technician 4', 'Technician 5']; 

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
        // this.form.due = input.value;
        this.showDatePicker = false; // إخفاء الـ Date Picker بعد الاختيار
    }


  // حفظ بيانات التاريخ من form2 → رجوع لـ form1
  saveDateForm() {
    this.step = 1;
  }

  // فتح review form
  openReview() {
    this.step = 4;
  }

  doClose() {
    this.close.emit();
  }

   goBack() {
    const prev = this.step - 1;
    this.step = prev === 4 ? 3 : prev;
  }
  submitted = false;
  goNext() {
    this.submitted = true;

  if (this.step==1&&(
    !this.form.projectName || 
      !this.selectedClientId ||
      !this.form.ProjectType ||
      !this.form.phoneNumber||
      !this.form.emailAddress||
      !this.unitsList.some((u:any)=>u.isSelected))) {
    return; // ❌ يمنع الحفظ
  }
  else if(this.step==2&&(
    !this.form.contractType ||
      !this.form.paymentTerms
  )){
    return; // ❌ يمنع الحفظ
  }
    // console.log(this.form.project);
    const next = this.step + 1;
    this.step = next === 4 ? 5 : next;
  }
  doSaveFinal() {  
    const { contractFiles, boqFiles, ...rest } = this.form;
    const selected = this.unitsList
      .filter(u => !!u.isSelected && Number(u.quantityToUse) > 0)
      .map(u => ({ unitId: Number(u.id), qty: Number(u.quantityToUse) }));
    const unitIds = selected.map(s => s.unitId);
    this.loading = true;
    this.save.emit({ ...rest, clientId: this.selectedClientId, unitIds, selectedUnits: selected });
  }

   forceDatePicker(event: Event) {
    const target = event.target as HTMLInputElement;
    // التأكد أن الدالة موجودة قبل استدعائها
    if (target.showPicker) {
      target.showPicker();
    }
  }


    
  // دالة العودة للتعديل (العودة إلى الخطوة 1)
  editVisit() {
    this.step = 1;
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

  unitQuery: string = '';
  getFilteredUnits() {
    const q = (this.unitQuery || '').trim().toLowerCase();
    if (!q) return this.unitsList;
    return this.unitsList.filter((u: any) => 
      (u.model || '').toLowerCase().includes(q) || 
      (u.serial || '').toLowerCase().includes(q)
    );
  }
  hasSelectedUnits(): boolean {
    return Array.isArray(this.unitsList) && this.unitsList.some((u: any) => !!u.isSelected);
  }

  loadUnits() {
    this.markLoadingStart();
    this.unitService.getAll().subscribe({
      next: (list) => {
        this.unitsList = (list || [])
          .map((u: any) => ({
            id: u.id,
            model: u.model,
            serial: u.serial,
            price: u.price,
            quantity: u.quantity,
            isSelected: false,
            quantityToUse: 1
          }))
          .filter((u: any) => Number(u.quantity) > 0);
      },
      error: () => {
        this.unitsList = [];
      },
      complete: () => { this.markLoadingEnd(); }
    });
  }

  toggleUnitSelection(unit: any, checked?: boolean) {
    unit.isSelected = typeof checked === 'boolean' ? checked : !unit.isSelected;
    if (unit.isSelected && (!unit.quantityToUse || unit.quantityToUse < 1)) {
      unit.quantityToUse = 1;
    }
  }
  onUnitCheckboxChange(unit: any, event: any) {
    this.toggleUnitSelection(unit, !!event?.target?.checked);
  }
  onQtyChange(unit: any) {
    const max = Number(unit.quantity) || 0;
    let val = Number(unit.quantityToUse) || 0;
    if (val < 1) val = 1;
    if (val > max) val = max;
    unit.quantityToUse = val;
  }

  updateContractDuration() {
    const startStr = this.form.contractStartDate;
    const endStr = this.form.contractEndDate;
    if (!startStr || !endStr) {
      this.form.contractDuration = '';
      return;
    }
    const start = new Date(startStr);
    const end = new Date(endStr);
    if (isNaN(start.getTime()) || isNaN(end.getTime()) || end < start) {
      this.form.contractDuration = '';
      return;
    }
    const ms = end.getTime() - start.getTime();
    const days = Math.round(ms / (1000 * 60 * 60 * 24));
    const months = Math.round(days / 30);
    this.form.contractDuration = months >= 1 ? `${months} month${months > 1 ? 's' : ''}` : `${days} day${days > 1 ? 's' : ''}`;
  }
//   // دالة مسح كل بيانات الزيارة (Reset Form)
//   clearVisit() {
//     // إعادة تعيين الـ Form إلى القيم الافتراضية
//     this.form = {
//       project: '',
//       units: '',   
//       address: '', 
//       due: '',        
//       time: '',
//       objective: '',
//       technicians: [] as string[]
//     };
//     
//     // إغلاق الـ Modal أو العودة للخطوة 1 الفارغة
//     this.step = 1; 
//   }

//انا هنا ضيفت ال Event عشان اعرف انهي واحده بالظبط الي استدعت ال function دي عشان عندي 
// file and BOQ_ShopDrawing
 openFilePicker(element: any) {
  console.log(element);
  
  const input = document.createElement('input');
  input.type = 'file';
  input.multiple = true;
  // input.accept = 'image/*'; // الصور فقط

  input.onchange = (event: Event) => {
    const target = event.target as HTMLInputElement;
    const files = target.files;
    if (!files || files.length === 0) return;

     // حول FileList لمصفوفة File[]
    const filesArray: File[] = Array.from(files);

    filesArray.forEach((file: File) => {
      if (file.size > this.maxFileSize * 1024 * 1024) {
        console.warn(`File too large: ${file.name}`);
        return;
      }

      if (!this.allowedFileTypes.includes(file.type)) {
        console.warn(`Unsupported type: ${file.type}`);
        return;
      }

      const reader = new FileReader();
    // فضي الصور القديمة
    // this.form.files = [];
    // انا هخليه يبعت 0,1 وهعمل عليهم chack عشان اعرف في انهي واحد
    // لو ال element =0 يبقي كدا هيضيف في ال fils لكن لو 1 يبقي هيضيف في BOQ_ShopDrawing
    if(element==0){
      reader.onload = () => {
        if (reader.result) {
          const url = reader.result as string;
          this.form.contractFiles.push({ name: file.name, type: file.type, url });
          if (file.type.startsWith('image/')) {
            this.form.files.push(url);
          }
        }
      };
    } else {
      reader.onload = () => {
        if (reader.result) {
          const url = reader.result as string;
          this.form.boqFiles.push({ name: file.name, type: file.type, url });
          if (file.type.startsWith('image/')) {
            this.form.BOQ_ShopDrawing.push(url);
          }
        }
      };
    }
   
     
      reader.readAsDataURL(file);
    });
  };

  // افتح File Picker يدويًا
  input.click();
}
 openUrl(url: string, name?: string) {
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
 removeContractFile(index: number) {
   if (index < 0 || index >= this.form.contractFiles.length) return;
   const item = this.form.contractFiles[index];
   if (item.type.startsWith('image/')) {
     const idx = this.form.files.indexOf(item.url);
     if (idx >= 0) this.form.files.splice(idx, 1);
   }
   this.form.contractFiles.splice(index, 1);
 }
 removeBoqFile(index: number) {
   if (index < 0 || index >= this.form.boqFiles.length) return;
   const item = this.form.boqFiles[index];
   if (item.type.startsWith('image/')) {
     const idx = this.form.BOQ_ShopDrawing.indexOf(item.url);
     if (idx >= 0) this.form.BOQ_ShopDrawing.splice(idx, 1);
   }
   this.form.boqFiles.splice(index, 1);
 }

 removeFile(index: number, element: number) {
   if (element === 0) {
     if (index < 0 || index >= this.form.files.length) return;
     this.form.files.splice(index, 1);
   } else {
     if (index < 0 || index >= this.form.BOQ_ShopDrawing.length) return;
     this.form.BOQ_ShopDrawing.splice(index, 1);
   }
 }
}
