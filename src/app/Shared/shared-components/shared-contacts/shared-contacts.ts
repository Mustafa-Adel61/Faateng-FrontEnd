import { SharedPageHeader } from './../../shared-layout/shared-page-header/shared-page-header';
import { Component, Input } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule, NgIf, NgFor, NgClass } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CreateNewContact } from '../../../admin/pages/create-new-contact/create-new-contact';
import { ResourceService } from '../../../core/resource.service';
import { Loading } from '../loading/loading';
interface UserRow {
  selected: boolean;
  id: string;
  name: string;
  role: string;
  email: string;
  phone?: string;
  position?: string;
  isActive?: boolean;
}
interface Contact {
  selected: boolean;
  Contract: string;
  Client: string;
  Project: string;         // date string
  Start: string;
  End: string;
  DaysLeft: number;
  Cycle: string;
  Value: number;
  NextBill: string;
  Status?:  'Active' | 'Pending'|'Expired'| string;
  photos?: string[];
}
@Component({
  selector: 'app-shared-contacts',
  standalone: true,
  imports: [CommonModule,FormsModule,CreateNewContact,NgIf,NgFor,NgClass,SharedPageHeader, Loading],
  templateUrl: './shared-contacts.html',
  styleUrl: './shared-contacts.css'
})
export class SharedContacts {

// UI state
  showFilterBuilder = false;
  // ضيفت ال data من والي 
  newFilter = { field: '', value: '', dateFrom: '', dateTo: '' };
  activeFilters: { field: string; value: string; dateFrom?: string; dateTo?: string }[] = [];
  // details panel
  showDetails = false;
  selectedTask: Contact | null = null;

  // Selection
  allSelected = false;
 //  search text
  searchText: string = '';
  // Pagination
  page = 1;
  pageSize = 10;
    statuses = [
  'Active',
  'Pending',
  'Expired',
];
  // بيانات تجريبية
  // tasks = Array.from({ length: 90 }).map((_, i) => ({
    //   selected: false,
  //   ClientCompanyName: i % 2 === 0 ? 'Mustafa Adel' : 'salah hassan',
  //   CompanyName: i % 2 === 0 ? 'Massfluence' : 'Mepsol',//دا زياده عشان الشكل بس مش اكتر وببعتله اي قيمه 
  //   serviceType: i % 2 === 0 ? 'Massfluence' : 'Mepsol',
  //   phoneNumber: i % 2 === 0 ? '(406)555-0120' : '(406)555-1234',
  //   emailAddress: 'mustafa@gmial.com',
  //   location: 'Damascus',
  // }));
  @Input() role: 'admin' | 'finance' | 'manager'|null=null;
  users: UserRow[] = [];
  loadingUsers = false;
  tasks: Contact[] = [];
  constructor(private resource: ResourceService, private router: Router) {}
  ngOnInit(): void {
    this.loadUsers();
  }
  loadUsers() {
    this.loadingUsers = true;
    this.resource.getAll('Users').subscribe({
      next: (items) => {
        this.users = (items || []).map((u: any) => ({
          selected: false,
          id: u.id,
          name: u.fullName || u.email || u.id,
          role: u.role || '',
          email: u.email || '',
          phone: u.phone || '',
          position: u.position || '',
          isActive: typeof u.isActive === 'boolean' ? u.isActive : true
        }));
      },
      complete: () => { this.loadingUsers = false; }
    });
  }
  userAllSelected = false;
  userSearchText: string = '';
  userPage = 1;
  userPageSize = 10;
  selectedUser: UserRow | null = null;
  userFilterBuilder = false;
  userNewFilter = { field: '', value: '' };
  userActiveFilters: { field: string; value: string }[] = [];
  toggleUserFilterBuilder() {
    this.userFilterBuilder = !this.userFilterBuilder;
    this.userNewFilter = { field: '', value: '' };
  }
  getUserFilterValues(field: string): string[] {
    if (!field) return [];
    const values = this.users
      .map(u => (u as any)[field])
      .filter(v => v !== undefined && v !== null)
      .map(v => String(v));
    return Array.from(new Set(values));
  }
  applyUserFilter() {
    if (!this.userNewFilter.field) return;
    if (this.userNewFilter.value) {
      this.userActiveFilters.push({ ...this.userNewFilter });
    }
    this.userNewFilter = { field: '', value: '' };
    this.userFilterBuilder = false;
    this.userPage = 1;
  }
  removeUserFilter(idx: number) {
    this.userActiveFilters.splice(idx, 1);
    if (this.userPage > this.userTotalPages) this.userPage = this.userTotalPages;
  }
  clearAllUserFilters() {
    this.userActiveFilters = [];
    this.userPage = 1;
  }
  get filteredUsers(): UserRow[] {
    let result = this.users;
    if (this.userActiveFilters.length) {
      result = result.filter(u =>
        this.userActiveFilters.every(f => {
          const v = (u as any)[f.field];
          if (v == null) return false;
          return String(v).toLowerCase() === String(f.value).toLowerCase();
        })
      );
    }
    if (this.userSearchText.trim() !== '') {
      const s = this.userSearchText.toLowerCase();
      result = result.filter(u => (u.name || '').toLowerCase().includes(s) || (u.email || '').toLowerCase().includes(s));
    }
    return result;
  }
  get userTotalPages(): number {
    return Math.max(1, Math.ceil(this.filteredUsers.length / this.userPageSize));
  }
  get pagedUsers(): UserRow[] {
    const start = (this.userPage - 1) * this.userPageSize;
    return this.filteredUsers.slice(start, start + this.userPageSize);
  }
  get userVisiblePages(): number[] {
    const pages: number[] = [];
    const maxButtons = 5;
    if (this.userTotalPages <= maxButtons) {
      for (let i = 1; i <= this.userTotalPages; i++) pages.push(i);
    } else {
      let start = this.userPage - Math.floor(maxButtons / 2);
      let end = this.userPage + Math.floor(maxButtons / 2);
      if (start < 1) {
        start = 1;
        end = maxButtons;
      }
      if (end > this.userTotalPages) {
        end = this.userTotalPages;
        start = this.userTotalPages - maxButtons + 1;
      }
      for (let i = start; i <= end; i++) pages.push(i);
    }
    return pages;
  }
  setUserPage(p: number) {
    if (p >= 1 && p <= this.userTotalPages) this.userPage = p;
  }
  toggleUserAll() {
    this.pagedUsers.forEach(u => (u.selected = this.userAllSelected));
    this.selectedCount = this.pagedUsers.filter(u => u.selected).length;
  }
  updateUserAllSelected() {
    this.userAllSelected = this.pagedUsers.length > 0 && this.pagedUsers.every(u => u.selected);
    this.selectedCount = this.pagedUsers.filter(u => u.selected).length;
  }
  performUserAction(user: UserRow, action: string) {
    if (action === 'view') {
      this.openUserDetails(user);
    }
  }
  onUserSelectChange(user: UserRow, event: Event) {
    const selectElement = event.target as HTMLSelectElement;
    const value = selectElement.value;
    this.performUserAction(user, value);
    selectElement.selectedIndex = 0;
    selectElement.value = '';
  }
  openUserDetails(user: UserRow) {
    this.selectedUser = user;
    this.showDetails = true;
    window.scrollTo({ top: 0, behavior: 'smooth' });
    document.body.style.overflow = 'hidden';
  }
  closeUserDetails() {
    this.selectedUser = null;
    this.showDetails = false;
    document.body.style.overflow = 'auto';
  }
  canEditStatus(): boolean {
    return this.role === 'admin' || this.role === 'manager';
  }
  updateUserStatus(user: UserRow, value: 'Active' | 'Inactive') {
    const id = user.id;
    const payload = value === 'Active'; // ✅ أرسل boolean لضمان Content-Type: application/json
    this.resource.update('Users', id + '/status', payload).subscribe({
      next: () => {
        const u = this.users.find(x => x.id === id);
        if (u) u.isActive = value === 'Active';
        if (this.selectedUser && this.selectedUser.id === id) {
          this.selectedUser.isActive = value === 'Active';
        }
      }
    });
  }
  getRoleCount(role: string): number {
    return this.users.filter(u => String(u.role).toLowerCase() === role.toLowerCase()).length;
  }
  loadTasks(){
    if(this.role==='admin'||'manager'){
      this.tasks = [
    {
    selected: false,
    Contract:'CTR-3001',
  	Client:'Carlton Hotel – Damascus',
    Project:'Elevator PM',
    Start:'2025-01-01',
    End:'2025-12-31',	
    DaysLeft:54,
    Cycle:'Monthly',
    Value:1440000,
    NextBill:'2025-11-01',
    Status:'Active',
    photos:['assets/images/p2.png','assets/images/p3.png','assets/images/p4.jpg',
      'assets/images/p1.jpg','assets/images/p5.jpg'
    ]	
    }, 
    {
    selected: false,
    Contract:'CTR-3002',
  	Client:'EU Embassy',
    Project:'HVAC Retrofit',
    Start:'2025-06-01',
    End:'2026-05-31',	
    DaysLeft:205,
    Cycle:'Quarterly',
    Value:49600.00,
    NextBill:'2025-12-01',
    Status:'Pending',
    photos:['assets/images/p2.png','assets/images/p3.png','assets/images/p4.jpg',
      'assets/images/p1.jpg','assets/images/p5.jpg'
    ]	
    }, 
    {
    selected: false,
    Contract:'CTR-3003',
  	Client:'Al Badya Cement',
    Project:'Fire Pump Maintenance',
    Start:'2024-07-01',
    End:'2025-07-01',	
    DaysLeft:0,
    Cycle:'Annual',
    Value:9600.00,
    NextBill:'2025-07-01',
    Status:'Active',
    photos:['assets/images/p2.png','assets/images/p3.png','assets/images/p4.jpg',
      'assets/images/p1.jpg','assets/images/p5.jpg'
    ]	
    }, 
    {
    selected: false,
    Contract:'CTR-3001',
  	Client:'Carlton Hotel – Damascus',
    Project:'Elevator PM',
    Start:'2025-01-01',
    End:'2025-12-31',	
    DaysLeft:54,
    Cycle:'Monthly',
    Value:1440000,
    NextBill:'2025-11-01',
    Status:'Pending',
    photos:['assets/images/p2.png','assets/images/p3.png','assets/images/p4.jpg',
      'assets/images/p1.jpg','assets/images/p5.jpg'
    ]	
    }, 
    {
    selected: false,
    Contract:'CTR-3004',
  	Client:'Park Residence',
    Project:'Elevator Modernization',
    Start:'2024-03-01	',
    End:'2024-12-31',	
    DaysLeft:0,
    Cycle:'One-off',
    Value:48000.00,
    NextBill:'N/A',
    Status:'Expired',
    photos:['assets/images/p2.png','assets/images/p3.png','assets/images/p4.jpg',
      'assets/images/p1.jpg','assets/images/p5.jpg'
    ]	
    }, 
  
  ];
    }
    else if(this.role==='finance'){
     this.tasks = [
    {
    selected: false,
    Contract:'CTR-3001',
  	Client:'Carlton Hotel – Damascus',
    Project:'Elevator PM',
    Start:'2025-01-01',
    End:'2025-12-31',	
    DaysLeft:54,
    Cycle:'Monthly',
    Value:1440000,
    NextBill:'2025-11-01',
    Status:'Active',
    photos:['assets/images/p2.png','assets/images/p3.png','assets/images/p4.jpg',
      'assets/images/p1.jpg','assets/images/p5.jpg'
    ]	
    }, 
    {
    selected: false,
    Contract:'CTR-3002',
  	Client:'EU Embassy',
    Project:'HVAC Retrofit',
    Start:'2025-06-01',
    End:'2026-05-31',	
    DaysLeft:205,
    Cycle:'Quarterly',
    Value:49600.00,
    NextBill:'2025-12-01',
    Status:'Pending',
    photos:['assets/images/p2.png','assets/images/p3.png','assets/images/p4.jpg',
      'assets/images/p1.jpg','assets/images/p5.jpg'
    ]	
    }];}
  
  }
  
  
  //لاحظ اني حطات قيمتها في ال applayDetails
  mainImage: string = '';
    setMainImage(photoPath: string) {
    this.mainImage = photoPath;
  }
  selectedCount=0;
  // ---------------- selection ----------------
  toggleAll() {
    this.pagedTasks.forEach(t => (t.selected = this.allSelected));
    this.selectedCount=this.pagedTasks.filter(t => t.selected).length;
  }
numberOfSelcted:number=0;
  updateAllSelected() {
    // update global checkbox according to visible (paged) items
    this.allSelected =
      this.pagedTasks.length > 0 &&
      this.pagedTasks.every(t => t.selected);
      // بظبط عدد المحددين
      this.selectedCount=this.pagedTasks.filter(t => t.selected).length;
  }

  // ---------------- pagination / filtered list getters ----------------
get filteredTasks(): Contact[] {
  
  let result = this.tasks;
  console.log("Mustafa");
  
  if (this.activeFilters.length) {
    result = result.filter(task =>
      this.activeFilters.every(f => {
        const v = (task as any)[f.field];
        if (v == null) return false;
        
        console.log(f.field);
        // ✅ لو الفلتر تاريخ
        if (f.field === 'Start') {
          const taskDate = new Date(task.Start);
          const from = f.dateFrom ? new Date(f.dateFrom) : null;
          const to = f.dateTo ? new Date(f.dateTo) : null;
          if (from && taskDate < from) return false;
          if (to && taskDate > to) return false;
          return true;
        }
        else if (f.field === 'End') {
          const taskDate = new Date(task.End);
          const from = f.dateFrom ? new Date(f.dateFrom) : null;
          const to = f.dateTo ? new Date(f.dateTo) : null;
          if (from && taskDate < from) return false;
          if (to && taskDate > to) return false;
          return true;
        }
        else if (f.field === 'NextBill') {
          const taskDate = new Date(task.NextBill);
          const from = f.dateFrom ? new Date(f.dateFrom) : null;
          const to = f.dateTo ? new Date(f.dateTo) : null;
          if (from && taskDate < from) return false;
          if (to && taskDate > to) return false;
          return true;
        }

        // باقي الفلاتر العادية
        return String(v).toLowerCase() === String(f.value).toLowerCase();
      })
    );
  }

  // 🔹 فلترة البحث
  if (this.searchText.trim() !== '') {
    const search = this.searchText.toLowerCase();
    result = result.filter(task => task.Client.toLowerCase().includes(search));
  }

  return result;
}



  get totalPages(): number {
    return Math.max(1, Math.ceil(this.filteredTasks.length / this.pageSize));
  }

  get pagedTasks(): Contact[] {
    const start = (this.page - 1) * this.pageSize;
    return this.filteredTasks.slice(start, start + this.pageSize);
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

  // ---------------- filter builder ----------------
  toggleFilterBuilder() {
    this.showFilterBuilder = !this.showFilterBuilder;
    // reset newFilter
    this.newFilter = { field: '', value: '', dateFrom: '', dateTo: '' };
  }

  getFilterValues(field: string): string[] {
    if (!field) return [];
    const values = this.tasks
      .map(t => (t as any)[field])
      .filter(v => v !== undefined && v !== null)
      .map(v => String(v));
    return Array.from(new Set(values));
  }
    getStatusCount(status: string): number {
  return this.tasks.filter(t => t.Status === status).length;
}
applyFilter() {
  console.log(this.newFilter.field);  
  if (!this.newFilter.field) return;

  if (this.newFilter.field === 'Start') {
    if (!this.newFilter.dateFrom && !this.newFilter.dateTo) return;
    this.activeFilters.push({
      field: 'Start',
      value: `${this.newFilter.dateFrom || '...'} → ${this.newFilter.dateTo || '...'}`,
      dateFrom: this.newFilter.dateFrom,
      dateTo: this.newFilter.dateTo
    });
  } 
  else if (this.newFilter.field === 'End') {
    if (!this.newFilter.dateFrom && !this.newFilter.dateTo) return;
    this.activeFilters.push({
      field: 'End',
      value: `${this.newFilter.dateFrom || '...'} → ${this.newFilter.dateTo || '...'}`,
      dateFrom: this.newFilter.dateFrom,
      dateTo: this.newFilter.dateTo
    });
  } 
  else if (this.newFilter.field === 'NextBill') {
    if (!this.newFilter.dateFrom && !this.newFilter.dateTo) return;
    this.activeFilters.push({
      field: 'NextBill',
      value: `${this.newFilter.dateFrom || '...'} → ${this.newFilter.dateTo || '...'}`,
      dateFrom: this.newFilter.dateFrom,
      dateTo: this.newFilter.dateTo
    });
  } 
  else if (this.newFilter.value) {
    console.log('sasa');
    
    this.activeFilters.push({ ...this.newFilter });
  }

  this.newFilter = { field: '', value: '', dateFrom: '', dateTo: '' };
  this.showFilterBuilder = false;
  this.page = 1;
}



  removeFilter(idx: number) {
    this.activeFilters.splice(idx, 1);
    // keep page valid
    if (this.page > this.totalPages) this.page = this.totalPages;
  }

  clearAllFilters() {
    this.activeFilters = [];
    this.page = 1;
  }

  // ---------------- actions ----------------
  performAction(task: Contact, action: string) {
    if (action === 'view') {
      this.openDetails(task);
    } else if (action === 'delete') {
      if (!confirm(`Delete ${task.Contract}?`)) return;
      // حذف من المصدر
      const idx = this.tasks.indexOf(task);
      if (idx >= 0) this.tasks.splice(idx, 1);
      // adjust pagination if needed
      if (this.page > this.totalPages) this.page = this.totalPages;
    }
  }

  onSelectChange(task: any, event: Event) {
  const selectElement = event.target as HTMLSelectElement;
  const value = selectElement.value;

  this.performAction(task, value);
}


  // ---------------- details panel ----------------
  openDetails(task: Contact) {
    //بحيط القيمه في ال main image عشان ال Details يشتغل صح
    if(task.photos && task.photos.length>0){
    this.mainImage = task.photos[0];}
    this.selectedTask = task;
    this.showDetails = true;
    // scroll to top so details visible (optional)
    window.scrollTo({ top: 0, behavior: 'smooth' });
      document.body.style.overflow = 'hidden'; // يمنع scroll الصفحة

  }

  closeDetails() {
    this.selectedTask = null;
    this.showDetails = false;
      document.body.style.overflow = 'auto'; // يرجع scroll الصفحة

  }
  getSortedStatuses(current: any) {
  // الحالة الحالية تبقى أول وحدة
  return [current, ...this.statuses.filter(s => s !== current)];
}

updateTaskStatus(task: any) {
  // لو عايز التغيير ينعكس على الجدول فورًا:
  const index = this.tasks.findIndex(t => t.Contract === task.Contact);
  if (index !== -1) {
    this.tasks[index].Status = task.Status;
  }
}
  forceDatePicker(event: Event) {
    const target = event.target as HTMLInputElement;
    // التأكد أن الدالة موجودة قبل استدعائها
    if (target.showPicker) {
      target.showPicker();
    }
  }



//create new visit modal logic

 showCreate = false;

  openCreate() {
    this.router.navigate(['/register']);

  }
  closeCreate() {
    this.showCreate = false;
      document.body.style.overflow = 'auto'; // يرجع scroll الصفحة

  }

  addTask(newVisit: any) {
    // شكل الـ task بسيط لعرضه في الجدول — عدّل الحقول كما يلزمك
    console.log(newVisit);
    const newTask = {
      selected: false,
      Contract:  'CTR-3000',
      Client:newVisit.Client || 'MassFluence',
      Project: newVisit.LinkedProject|| 'MassFluence',
      Start: newVisit.Start || '',
      End: newVisit.End || '',
      DaysLeft: newVisit.End ? Math.ceil((new Date(newVisit.End).getTime() - new Date(newVisit.Start).getTime()) / (1000 * 60 * 60 * 24)) : 0,
      Cycle: newVisit.BillingCycle || '',
      Value: newVisit.AmountperCycle || 0,
      NextBill:  '2025-12-17',
      Status: 'Active',
    };
    // أدخله البداية عشان يطلع أول العنصر
    this.tasks.unshift(newTask);
    // ارحِع للصفحة الأولى من pagination (اختياري)
    this.page = 1;
    this.showCreate = false;
    document.body.style.overflow = 'auto'; // يرجع scroll الصفحة
  }
  ContractValue():number{
    let count:number=0;
    this.tasks.forEach(element => {
      if(typeof( element.Value)=='number')
        count+=element.Value;
      else{
        const num = Number(element.Value);
        count+=num;
      }
  });
  return count;
  }
  
//   getStatusCount(status: string): number {
//     if(status=='total')
//      {
//       //هنا انا عملتها علي كله بس عايز اظبطها علي تاريخ الشهر الي الحالي فقط 
//      }
//     else
//       {
//     this.tasks.forEach(element => {
//       if(element.Status===status){
//         count+=element.Amount;
//       }
//     });}
//   return count;
//  }
  
}
