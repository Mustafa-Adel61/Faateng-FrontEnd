import { SharedPageHeader } from './../../shared-layout/shared-page-header/shared-page-header';
import { NgIf, NgFor, DatePipe, NgStyle } from '@angular/common';
import { Component, Input, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CreateNewVisit } from '../../../admin/pages/create-new-visit/create-new-visit';
import { TaskService, TaskItem } from '../../../core/task.service';
import { SharedTaskDetails } from "../shared-task-details/shared-task-details";
import { AuthService } from '../../../core/auth';

interface CalendarTask {
  id: number;
  title: string;
  project: string;
  assignee: string[];
  date: string; // 'YYYY-MM-DD'
  time: string; // 'HH:mm'
  timeEnd: string; // 'HH:mm'
  color: string; // for styling (e.g. '#eafbe7')
  status?: string;
  originalTask?: TaskItem;
}

@Component({
  selector: 'app-shared-calender',
  standalone: true,
  imports: [NgIf, NgFor, DatePipe, NgStyle, FormsModule, CreateNewVisit, SharedPageHeader, SharedTaskDetails],
  templateUrl: './shared-calender.html',
  styleUrl: './shared-calender.css'
})
export class SharedCalender implements OnInit {
  hoveredCell: string | null = null;
  showCreateForm = false;
  formData: any = { project: '', assignee: '', time: '', timeEnd: '', date: '' };
  @Input() role: 'admin' | 'dispatcher' | 'manager' | 'technician' | null = null;
  constructor(private taskService: TaskService, private auth: AuthService) { }

  openCreateForm() {
    console.log('openCreateForm called for'); // ✅ check

    // this.formData = {
    //   project: '',
    //   assignee: '',
    //   time: `${hour}:00`,
    //   timeEnd: `${hour + 1}:00`,
    //   date: day.toISOString().slice(0, 10)
    // };
    this.showCreateForm = true;
  }
  saveNewVisit(newVisit: any) {
    const colors = ['#dceffd', '#fdeaea', '#fffbe7', '#eafbe7', '#f2d9ff', '#d9f2ff'];
    const randomColor = colors[Math.floor(Math.random() * colors.length)];
    //عشان اجيب ال EndTime
    // ✅ لو الـ time موجود، نزود عليه ساعة
    const startTime = newVisit.time || '11:00';
    const [hours, minutes] = startTime.split(':').map(Number);
    const endHour = (hours + 1) % 24; // علشان لو وصلت 23:00 تبقى 00:00

    const endTime = `${endHour.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;

    //بص عشان يجيب الحاجات الي جايه من ال front ف انا هناك بعت ال event بس وهنا ساويته بالقيم الي هناك 
    //لاحظ اني لازم احط الاسم الي هنا زي الي هنا مثلا newVisit.technicians

    const newTask: CalendarTask = {
      id: this.tasks.length + 1,
      title: 'New Visit',
      // project: this.formData.project || 'Untitled',
      project: newVisit.project || 'Untitled',
      assignee: newVisit.technicians || 'Unassign',
      date: newVisit.due || '2025-05-12',
      time: newVisit.time || '11:00',
      timeEnd: endTime || '12:00',
      color: randomColor
    };
    this.tasks.unshift(newTask);

    // this.tasks.push(newTask);
    this.showCreateForm = false;
  }

  closeCreate() {
    this.showCreateForm = false;
  }


  isCellEmpty(day: any, hour: number): boolean {
    const key = this.getDayKey(day);
    return !(this.tasksByDay[key]?.some((t: any) => t.time.startsWith(hour + ':')));
  }

  ngOnInit(): void {
    this.loadTask();
  }
  tasks: CalendarTask[] = [];
  hours: number[] = Array.from({ length: 24 }, (_, i) => i);
  loadTask() {
    const start = this.weekDays[0];
    const end = this.weekDays[6];
    const from = `${start.getFullYear()}-${String(start.getMonth() + 1).padStart(2, '0')}-${String(start.getDate()).padStart(2, '0')}T00:00:00`;
    const to = `${end.getFullYear()}-${String(end.getMonth() + 1).padStart(2, '0')}-${String(end.getDate()).padStart(2, '0')}T23:59:59`;
    this.taskService.calendar(from, to).subscribe(items => {
      const effectiveRole = this.role || this.auth.currentRole();
      const currentEmail = this.auth.getUserEmail();
      const currentId = this.auth.getUserId();
      if (effectiveRole === 'technician') {
        items = items.filter(t => {
          const emailMatch = !!currentEmail && (t.assigneeUser?.email || '') === currentEmail;
          const idMatch = !!currentId && (t.assigneeUserId || '') === currentId;
          return emailMatch || idMatch;
        });
      }
      const colors = ['#dceffd', '#fdeaea', '#fffbe7', '#eafbe7', '#f2d9ff', '#d9f2ff'];
      this.tasks = items.map(t => {
        const startStr = t.scheduledStart || t.scheduledEnd || '';
        const endStr = t.scheduledEnd || t.scheduledStart || '';
        const startDate = startStr ? new Date(startStr) : null;
        const endDate = endStr ? new Date(endStr) : null;
        const time = startDate ? `${String(startDate.getHours()).padStart(2, '0')}:${String(startDate.getMinutes()).padStart(2, '0')}` : '09:00';
        const timeEnd = endDate ? `${String(endDate.getHours()).padStart(2, '0')}:${String(endDate.getMinutes()).padStart(2, '0')}` : '10:00';
        const date = startDate ? `${startDate.getFullYear()}-${String(startDate.getMonth() + 1).padStart(2, '0')}-${String(startDate.getDate()).padStart(2, '0')}` : this.getDayKey(this.selectedDate);
        const assigneeUser = (t as any).assigneeUser;
        const assigneeLabel = assigneeUser?.fullName || assigneeUser?.email || t.assigneeUserId || '';
        return {
          id: t.id,
          title: t.title,
          project: (t as any)?.unit?.project?.name || t.unit?.client?.name || 'Project',
          assignee: assigneeLabel ? [assigneeLabel] : [],
          date,
          time,
          timeEnd,
          color: colors[Math.floor(Math.random() * colors.length)],
          status: t.status,
          originalTask: t
        } as CalendarTask;
      });
    });
  }



  // Calendar state
  selectedDate: Date = new Date(2025, 4, 12);
  view: 'year' | 'week' | 'month' | 'day' = 'week';
  selectedTask: CalendarTask | null = null;
  isUpdatingStatus = false;
  statuses = [
    'Scheduled',
    'Dispatched',
    'On-Site',
    'Waiting-Parts',
    'Backlog',
    'QA/Review',
    'Done',
    'Closed'
  ];

  get weekDays(): Date[] {
    // Return array of 7 days for the current week
    const start = new Date(this.selectedDate);
    start.setDate(start.getDate() - start.getDay() + 1); // Monday
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      return d;
    });
  }

  get tasksByDay(): { [key: string]: CalendarTask[] } {
    // Group tasks by date string
    const map: { [key: string]: CalendarTask[] } = {};
    for (const t of this.tasks) {
      if (!map[t.date]) map[t.date] = [];
      map[t.date].push(t);
    }
    return map;
  }

  // Navigation
  prev() {
    if (this.view === 'week') {
      this.selectedDate.setDate(this.selectedDate.getDate() - 7);
      this.selectedDate = new Date(this.selectedDate);
    }
    // month/day views can be added similarly
    this.loadTask();
  }

  //معموله بالشكل دا عشان يجيب التاريخ بالظبط مش بعده يوم
  getDayKey(day: Date): string {
    return day ? day.getFullYear() + '-' +
      (String(day.getMonth() + 1).padStart(2, '0')) + '-' +
      String(day.getDate()).padStart(2, '0') : '';
  }

  next() {
    if (this.view === 'week') {
      this.selectedDate.setDate(this.selectedDate.getDate() + 7);
      this.selectedDate = new Date(this.selectedDate);
    }
    this.loadTask();
  }
  today() {
    this.selectedDate = new Date();
    this.loadTask();
  }

  // Filter by date
  onDateChange(event: any) {
    this.selectedDate = new Date(event.target.value);
    this.view = 'day';
    this.loadTask();
  }

  setDay(d: Date) {
    this.selectedDate = new Date(d);
    this.view = 'day';
  }
  get displayDays(): Date[] {
    return this.view === 'day' ? [this.selectedDate] : this.weekDays;
  }

  hourPrefix(hour: number): string {
    return `${String(hour).padStart(2, '0')}:`;
  }
  openTaskDetails(task: CalendarTask) {
    this.selectedTask = task;
  }
  closeTaskDetails() {
    this.selectedTask = null;
  }
  get selectedTaskView() {
    if (!this.selectedTask) return null;
    const ot = this.selectedTask.originalTask;
    const assigneeUser = (ot as any)?.assigneeUser;
    const unitsText = ot?.unit ? `${ot.unit.model} (${ot.unit.serial})` : '';
    const address = (ot as any)?.locationName || (ot as any)?.unit?.project?.siteAddress || (ot as any)?.unit?.client?.address || '';
    const startStr = (ot as any)?.scheduledStart || (ot as any)?.scheduledEnd || '';
    const endStr = (ot as any)?.scheduledEnd || (ot as any)?.scheduledStart || '';
    const startDate = startStr ? new Date(startStr) : null;
    const endDate = endStr ? new Date(endStr) : null;
    const dueStr = startDate ? `${startDate.getFullYear()}-${String(startDate.getMonth() + 1).padStart(2, '0')}-${String(startDate.getDate()).padStart(2, '0')} ${String(startDate.getHours()).padStart(2, '0')}:${String(startDate.getMinutes()).padStart(2, '0')}` : '';
    const slaDueStr = endDate ? `${endDate.getFullYear()}-${String(endDate.getMonth() + 1).padStart(2, '0')}-${String(endDate.getDate()).padStart(2, '0')} ${String(endDate.getHours()).padStart(2, '0')}:${String(endDate.getMinutes()).padStart(2, '0')}` : '';
    const assigneeLabel = assigneeUser?.fullName || assigneeUser?.email || ot?.assigneeUserId || ((this.selectedTask.assignee && this.selectedTask.assignee.length) ? this.selectedTask.assignee[0] : '');
    return {
      name: this.selectedTask.title,
      status: this.selectedTask.status || 'Scheduled',
      slaStatus: (ot as any)?.slaStatus || 'Pending',
      priority: (ot as any)?.priority || 'Normal',
      team: (ot as any)?.team || 'Ops',
      units: unitsText || this.selectedTask.project || '',
      address,
      due: dueStr,
      slaDue: slaDueStr,
      objective: (ot as any)?.description || '',
      assignee: assigneeLabel
    };
  }
  updateSelectedTaskStatus(status: string) {
    if (!this.selectedTask || this.isUpdatingStatus) return;
    this.isUpdatingStatus = true;
    this.selectedTask.status = status || this.selectedTask.status || 'Scheduled';
    this.taskService.updateStatus(this.selectedTask.id, this.selectedTask.status).subscribe({
      next: () => {
        const idx = this.tasks.findIndex(t => t.id === this.selectedTask!.id);
        if (idx >= 0) this.tasks[idx].status = this.selectedTask!.status;
        this.isUpdatingStatus = false;
      },
      error: () => {
        this.isUpdatingStatus = false;
      }
    });
  }















  /////////////////////////////////////////////////////////
  // الكود دا بس عشان يظبط لون الساعه الي في التاسك تكون نفس اللون بتاع التاسك بس ازهي 


  // داخل Calendar component (أو أي component)
  private clamp(v: number, a = 0, b = 255) {
    return Math.max(a, Math.min(b, v));
  }

  private parseColor(input: string) {
    // يدعم: #rgb #rgba #rrggbb #rrggbbaa أو rgb(...) أو rgba(...)
    input = (input || '').trim();
    if (!input) return { r: 0, g: 0, b: 0, a: 1 };

    if (input.startsWith('rgb')) {
      const nums = input.replace(/rgba?|\(|\)|\s/g, '').split(',');
      return {
        r: +nums[0],
        g: +nums[1],
        b: +nums[2],
        a: nums[3] ? +nums[3] : 1
      };
    }

    if (input[0] === '#') {
      let hex = input.slice(1);
      if (hex.length === 3) {
        hex = hex.split('').map(h => h + h).join(''); // e.g. '2ef' -> '22eeff'
      } else if (hex.length === 4) {
        // rgba short form e.g. #rgba -> r,r,g,g,b,b,a,a
        const r = hex[0] + hex[0], g = hex[1] + hex[1], b = hex[2] + hex[2], a = hex[3] + hex[3];
        return { r: parseInt(r, 16), g: parseInt(g, 16), b: parseInt(b, 16), a: parseInt(a, 16) / 255 };
      } else if (hex.length === 8) {
        // rrggbbaa
        const r = hex.slice(0, 2), g = hex.slice(2, 4), b = hex.slice(4, 6), a = hex.slice(6, 8);
        return { r: parseInt(r, 16), g: parseInt(g, 16), b: parseInt(b, 16), a: parseInt(a, 16) / 255 };
      }
      // now hex length should be 6
      if (hex.length === 6) {
        return {
          r: parseInt(hex.slice(0, 2), 16),
          g: parseInt(hex.slice(2, 4), 16),
          b: parseInt(hex.slice(4, 6), 16),
          a: 1
        };
      }
    }

    // fallback
    return { r: 0, g: 0, b: 0, a: 1 };
  }

  private rgbToHsl(r: number, g: number, b: number) {
    r /= 255; g /= 255; b /= 255;
    const max = Math.max(r, g, b), min = Math.min(r, g, b);
    let h = 0, s = 0, l = (max + min) / 2;
    if (max !== min) {
      const d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      switch (max) {
        case r: h = (g - b) / d + (g < b ? 6 : 0); break;
        case g: h = (b - r) / d + 2; break;
        case b: h = (r - g) / d + 4; break;
      }
      h /= 6;
    }
    return { h: h * 360, s: s * 100, l: l * 100 };
  }

  private hslToRgb(h: number, s: number, l: number) {
    // h: 0..360, s,l: 0..100
    h /= 360; s /= 100; l /= 100;
    if (s === 0) {
      const v = Math.round(l * 255);
      return { r: v, g: v, b: v };
    }
    const hue2rgb = (p: number, q: number, t: number) => {
      if (t < 0) t += 1;
      if (t > 1) t -= 1;
      if (t < 1 / 6) return p + (q - p) * 6 * t;
      if (t < 1 / 2) return q;
      if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
      return p;
    }
    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;
    const r = hue2rgb(p, q, h + 1 / 3);
    const g = hue2rgb(p, q, h);
    const b = hue2rgb(p, q, h - 1 / 3);
    return { r: Math.round(r * 255), g: Math.round(g * 255), b: Math.round(b * 255) };
  }

  private toHex(r: number, g: number, b: number) {
    const to2 = (v: number) => v.toString(16).padStart(2, '0');
    return `#${to2(r)}${to2(g)}${to2(b)}`;
  }

  private getVividVariant(inputColor: string) {
    // يرجع كائن: { bg: 'hex|rgba', r,g,b, a }
    const { r, g, b, a } = this.parseColor(inputColor);
    const hsl = this.rgbToHsl(r, g, b);

    // قوة التعديل - عدّل حسب رغبتك
    let s = Math.min(100, hsl.s * 1.5); // 30% زيادة في التشبع
    let l = hsl.l;

    // لو اللون باهت (lightness عالية) نخليه أوضح عن طريق تقليل قليل،
    // لو غامق نخليه أفتح قليلًا — الهدف: درجة واضحة ومشبعة
    // ضبط الإضاءة علشان يطلع زاهي
    // if (l >= 70) {
    l = Math.max(45, l - 40);  // لو فاتح قوي نخليه أغمق
    // } else if (l <= 30) {
    //   l = Math.min(55, l + 50);  // لو غامق نخليه أفتح
    // } else {
    //   l = Math.min(65, l + 10);  // الوسط نزود إضاءة أكتر
    // }
    // نعيد اللون
    const rgb = this.hslToRgb(hsl.h, s, l);
    const bg = a < 1 ? `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${a})` : this.toHex(rgb.r, rgb.g, rgb.b);
    return { bg, r: rgb.r, g: rgb.g, b: rgb.b, a };
  }

  private luminance(r: number, g: number, b: number) {
    // relative luminance
    const toLin = (c: number) => {
      c /= 255;
      return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
    }
    return 0.2126 * toLin(r) + 0.7152 * toLin(g) + 0.0722 * toLin(b);
  }

  getTagStyles(inputColor: string) {
    // استعملها في القالب مباشرة: [ngStyle]="getTagStyles(task.color)"
    const v = this.getVividVariant(inputColor);
    const L = this.luminance(v.r, v.g, v.b);
    const text = L > 0.5 ? '#000000' : '#ffffff';
    return { 'background': v.bg, 'color': text };
  }


}
//#endregion