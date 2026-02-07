import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule, NgForm } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { SharedPageHeader } from '../../../Shared/shared-layout/shared-page-header/shared-page-header';
import { SharedServiceRequestes } from '../../../Shared/shared-components/shared-service-requestes/shared-service-requestes';
import { CreateServiceRequest } from '../../pages/create-service-request/create-service-request';

interface MaintenanceReport {
  reportId: string;
  date: string;
  VisitType: string;
  technician: string;
  maintenanceVisits: string[];
  workPerformed: string;
  // photosCount: number; 
  comments: string;
  systemId: string;
  selected: boolean; // للحفاظ على خاصية التحديد
  photos: string[]; // <--- إضافة هذه الخاصية (Array of photo paths)
}
@Component({
  selector: 'app-service-requests',
  imports: [FormsModule, CommonModule, SharedPageHeader, CreateServiceRequest, SharedServiceRequestes],
  templateUrl: './service-requests.html',
  standalone: true,
  styleUrl: './service-requests.css'
})
export class ServiceRequests implements OnInit {

  showCreateReportModal: boolean = false;
  activeTab: 'list' | 'map' = 'list';
  // mapUrl: SafeResourceUrl;
  allSelected = false;

  // 3. تحديث البيانات الثابتة (tasks) إلى بيانات التقارير (reports)
  reports: MaintenanceReport[] = [
    {
      reportId: 'MR-001', date: 'Jun 24, 2022', VisitType: 'Scheduled', maintenanceVisits: ['MV522', 'MV435'], workPerformed: 'Replaced faulty wiring in the control panel', technician: 'Yazeed Hassan', comments: 'The unit is now functioning well, but monitor for any further issues', systemId: 'HVAC-001', selected: false,
      photos: ['assets/images/p2.png']
    },
    {
      reportId: 'MR-001', date: 'Jun 24, 2022', VisitType: 'unscheduled', maintenanceVisits: ['MV522', 'MV435'], workPerformed: 'Performed routine HVAC filter replacement and cleaned ducts.', technician: 'Mouth Abdel-Latif', comments: 'Filters were extremely clogged; recommend more frequent checks.', systemId: 'HVAC-002', selected: false,
      photos: ['assets/images/p1.jpg', 'assets/images/p2.png', 'assets/images/p3.png', 'assets/images/p5.jpg']

    },
    {
      reportId: 'MR-002', date: 'Jun 24, 2022', VisitType: 'Scheduled', maintenanceVisits: ['MV522', 'MV435', 'MV452'], workPerformed: 'Tested fire alarm system and replaced two faulty sensors.', technician: 'Yazeed Hassan', comments: 'Filters were extremely clogged; recommend more frequent checks.', systemId: 'HVAC-003', selected: false

      ,
      photos: ['assets/images/p1.jpg', 'assets/images/p2.png', 'assets/images/p3.png', 'assets/images/p5.jpg']
    },
    {
      reportId: 'MR-002', date: 'Jun 24, 2022', VisitType: 'unscheduled', maintenanceVisits: ['MV522', 'MV435'], workPerformed: 'Elevator motor and lubricated moving parts.', technician: 'Marwan Taufiq', comments: 'System is fully operational after sensor replacement.', systemId: 'HVAC-001', selected: false
      ,
      photos: ['assets/images/p1.jpg', 'assets/images/p2.png', 'assets/images/p3.png', 'assets/images/p5.jpg']

    },
    {
      reportId: 'MR-001', date: 'Jun 24, 2022', VisitType: 'Scheduled', maintenanceVisits: ['MV522', 'MV435'], workPerformed: 'Replaced faulty wiring in the control panel', technician: 'Yazeed Hassan', comments: 'The unit is now functioning well, but monitor for any further issues', systemId: 'HVAC-002', selected: false
      ,
      photos: ['assets/images/p1.jpg', 'assets/images/p2.png', 'assets/images/p3.png', 'assets/images/p5.jpg']

    },
    {
      reportId: 'MR-001', date: 'Jun 24, 2022', VisitType: 'unscheduled', maintenanceVisits: ['MV522', 'MV435'], workPerformed: 'Performed routine HVAC filter replacement and cleaned ducts.', technician: 'Mouth Abdel-Latif', comments: 'Filters were extremely clogged; recommend more frequent checks.', systemId: 'HVAC-003', selected: false
      ,
      photos: ['assets/images/p1.jpg', 'assets/images/p2.png', 'assets/images/p3.png', 'assets/images/p5.jpg']

    },
    {
      reportId: 'MR-002', date: 'Jun 24, 2022', VisitType: 'Scheduled', maintenanceVisits: ['MV522', 'MV435', 'MV452'], workPerformed: 'Tested fire alarm system and replaced two faulty sensors.', technician: 'Yazeed Hassan', comments: 'Filters were extremely clogged; recommend more frequent checks.', systemId: 'HVAC-001', selected: false
      ,
      photos: ['assets/images/p1.jpg', 'assets/images/p2.png', 'assets/images/p3.png', 'assets/images/p5.jpg']

    },
    {
      reportId: 'MR-002', date: 'Jun 24, 2022', VisitType: 'Scheduled', maintenanceVisits: ['MV522', 'MV435', 'MV452'], workPerformed: 'Tested fire alarm system and replaced two faulty sensors.', technician: 'Yazeed Hassan', comments: 'Filters were extremely clogged; recommend more frequent checks.', systemId: 'HVAC-001', selected: false
      ,
      photos: ['assets/images/p1.jpg', 'assets/images/p2.png', 'assets/images/p3.png', 'assets/images/p5.jpg']

    },
    {
      reportId: 'MR-002', date: 'Jun 24, 2022', VisitType: 'Scheduled', maintenanceVisits: ['MV522', 'MV435', 'MV452'], workPerformed: 'Tested fire alarm system and replaced two faulty sensors.', technician: 'Yazeed Hassan', comments: 'Filters were extremely clogged; recommend more frequent checks.', systemId: 'HVAC-001', selected: false
      ,
      photos: ['assets/images/p1.jpg', 'assets/images/p2.png', 'assets/images/p3.png', 'assets/images/p5.jpg']

    },
    {
      reportId: 'MR-002', date: 'Jun 24, 2022', VisitType: 'Scheduled', maintenanceVisits: ['MV522', 'MV435', 'MV452'], workPerformed: 'Tested fire alarm system and replaced two faulty sensors.', technician: 'Yazeed Hassan', comments: 'Filters were extremely clogged; recommend more frequent checks.', systemId: 'HVAC-001', selected: false
      ,
      photos: ['assets/images/p1.jpg', 'assets/images/p2.png', 'assets/images/p3.png', 'assets/images/p5.jpg']

    },
    {
      reportId: 'MR-002', date: 'Jun 24, 2022', VisitType: 'Scheduled', maintenanceVisits: ['MV522', 'MV435', 'MV452'], workPerformed: 'Tested fire alarm system and replaced two faulty sensors.', technician: 'Yazeed Hassan', comments: 'Filters were extremely clogged; recommend more frequent checks.', systemId: 'HVAC-001', selected: false
      ,
      photos: ['assets/images/p1.jpg', 'assets/images/p2.png', 'assets/images/p3.png', 'assets/images/p5.jpg']

    },
    {
      reportId: 'MR-002', date: 'Jun 24, 2022', VisitType: 'unscheduled', maintenanceVisits: ['MV522', 'MV435'], workPerformed: 'Elevator motor and lubricated moving parts.', technician: 'Marwan Taufiq', comments: 'System is fully operational after sensor replacement.', systemId: 'HVAC-002', selected: false,
      photos: ['assets/images/p1.jpg', 'assets/images/p2.png', 'assets/images/p3.png', 'assets/images/p5.jpg']

    },
    // ... أضف المزيد من البيانات هنا لتغطية الجدول بالكامل ...
  ];


  // *************** وظائف التحديد (Selection Functions) ***************
  toggleAll() {

    console.log('ToggleAll Called. Current state:', this.allSelected);
    // استخدم pagedReports مؤقتا لنتأكد أنها تعمل على العناصر المرئية
    // طبق الحالة الجديدة (this.allSelected) على كل التقارير في القائمة الأصلية
    this.reports.forEach(report => report.selected = this.allSelected);

    // (اختبار Debugging)
    console.log('ToggleAll Executed. allSelected is:', this.allSelected);
  }

  // 2. updateAllSelected(): لتحديث حالة الزر الرئيسي بناءً على حالة كل العناصر
  updateAllSelected() {
    // التحقق من كل عناصر الـ Array الأصلي
    this.allSelected = this.reports.length > 0 && this.reports.every(report => report.selected);
  }

  // *************** Pagination ***************
  page = 1;
  pageSize = 10;

  get pagedReports(): MaintenanceReport[] { // تغيير الاسم لـ pagedReports
    const start = (this.page - 1) * this.pageSize;
    return this.reports.slice(start, start + this.pageSize);
  }

  get totalPages() {
    // تم تغيير tasks.length إلى reports.length
    return Math.ceil(this.reports.length / this.pageSize);
  }
  // ... (باقي كود visiblePages و setPage كما هو) ...
  get visiblePages(): number[] { // هذا الـ Getter صحيح
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

  setPage(p: number) { // هذه الدالة صحيحة
    if (p >= 1 && p <= this.totalPages) this.page = p;
  }
  // 5. إضافة دالة لفتح صفحة التفاصيل
  openReportDetails(report: MaintenanceReport) {
    // استخدم الـ Router للانتقال لصفحة التفاصيل
    //لاحظ هنا عملت المسار كله عشان تشتغل
    this.router.navigate(['/dashboard/client/request-preview', report.reportId]);
    // إذا كنت تفضل استخدام Query Params: 
    // this.router.navigate(['/report-details'], { queryParams: { id: report.reportId } });
  }

  constructor(
    private route: ActivatedRoute,
    private router: Router // إضافة Router في constructor
  ) { }

  ngOnInit() {
    this.route.queryParams.subscribe(params => {
      const tab = params['tab'];
      this.activeTab = tab === 'map' ? 'map' : 'list';
    });
  }

  showCreateRequestModal = false;
  openCreateRequest() {
    this.showCreateRequestModal = true;
    document.body.style.overflow = 'hidden';
  }
  closeCreateRequest() {
    this.showCreateRequestModal = false;
    document.body.style.overflow = 'auto';
  }
  onRequestCreated() {
    this.closeCreateRequest();
  }
}
