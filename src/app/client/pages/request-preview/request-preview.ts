import { NgIf, NgFor } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { SharedPageHeader } from '../../../Shared/shared-layout/shared-page-header/shared-page-header';

@Component({
  selector: 'app-request-preview',
  imports: [SharedPageHeader,NgIf,NgFor],
  templateUrl: './request-preview.html',
  styleUrl: './request-preview.css'
})
export class RequestPreview implements OnInit{
reportId: string | null = null;
  reportDetails: any = null; // هنا ستضع بيانات التقرير التفصيلية
  mainImage: string = ''; // <--- إضافة لتتبع الصورة الرئيسية المعروضة
  // بيانات ثابتة مؤقتة (يجب أن تأتي من خدمة حقيقية)
  // يفضل عمل Service لهذه البيانات
  private dummyReportsData = {
    'MR-001': {
      reportId: 'MR-001',
      date: 'Jun 24, 2022',
      technician: 'Yazeed Hassan',
      systemId: 'HVAC-001',
      maintenanceVisits: [ 'MV435'], // <--- تأكد من وجودها إذا كنت تعرضها
      workPerformed: 'Tested fire alarm system and replaced two faulty sensors. Full system check, including calibration.',
      comments: 'Filters were extremely clogged; recommend more frequent checks. Sensors replaced: Sensor A (SN: 12345) and Sensor B (SN: 67890).',
      // تحديث لـ Array من الصور
      photos: [
      'assets/images/p2.png',
        'assets/images/p1.jpg',
        'assets/images/p3.png',
        'assets/images/p4.jpg'
      ],
    },
    'MR-002': { // مثال لتقرير MR-002
      reportId: 'MR-002',
      date: 'Jun 24, 2022',
      technician: 'Marwan Taufiq',
      systemId: 'HVAC-002',
      maintenanceVisits: ['MV522', 'MV435'],
      workPerformed: 'Elevator motor and lubricated moving parts. Inspection of all safety features completed.',
      comments: 'System is fully operational after sensor replacement. Recommended: lubrication every 6 months.',
      photos: [
       'assets/images/p2.png',
        'assets/images/p1.jpg',
        'assets/images/p3.png',
        'assets/images/p4.jpg'
      ],
    },
    // ... أضف تفاصيل باقي التقارير هنا بنفس النمط ...
  };
  constructor(private route: ActivatedRoute) { }

  ngOnInit(): void {
    // جلب الـ ID من المسار (URL)
    this.reportId = this.route.snapshot.paramMap.get('id');

     if (this.reportId) {
      this.reportDetails = this.dummyReportsData[this.reportId as keyof typeof this.dummyReportsData];
      // تعيين أول صورة كصورة رئيسية عند تحميل التفاصيل
      if (this.reportDetails && this.reportDetails.photos && this.reportDetails.photos.length > 0) {
        this.mainImage = this.reportDetails.photos[0];
      }
    }
  }
   setMainImage(photoPath: string) {
    this.mainImage = photoPath;
  }
}
