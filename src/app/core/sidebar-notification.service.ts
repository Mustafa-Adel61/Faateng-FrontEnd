import { Injectable, OnDestroy, computed, signal } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { catchError, filter, of } from 'rxjs';
import { API_BASE_URL } from './api.config';
import { AuthService } from './auth';

export type NotificationKey = 'service-request' | 'suggested-repair' | 'invoice-due';

/** One invoice that still needs to be paid, shown inside the notification dropdown. */
export interface NotificationDetail {
  id: number;
  title: string;
  meta: string;
  amount: number;
  overdue: boolean;
}

export interface SidebarNotification {
  key: NotificationKey;
  label: string;
  count: number;
  route: string;
  details?: NotificationDetail[];
}

export interface NotificationRoutes {
  serviceRequest: string;
  suggestedRepair: string;
  /** Omitted for roles that have no invoices page (e.g. dispatcher). */
  invoice?: string;
}

/** Roles that review incoming work, so only they get the work notifications. */
export const WORK_NOTIFICATION_ROLES = ['admin', 'manager', 'dispatcher'];
/** Roles that care about money: staff see every unpaid invoice, a client sees their own. */
export const INVOICE_NOTIFICATION_ROLES = ['admin', 'manager', 'finance', 'client'];

export const NOTIFICATION_ROUTES: Record<string, NotificationRoutes> = {
  admin: {
    serviceRequest: '/dashboard/admin/service-requests',
    suggestedRepair: '/dashboard/admin/suggested-repairs',
    invoice: '/dashboard/admin/invoices'
  },
  manager: {
    serviceRequest: '/dashboard/manager/service-requests',
    suggestedRepair: '/dashboard/manager/suggested-repairs-review',
    invoice: '/dashboard/manager/invoices'
  },
  dispatcher: {
    serviceRequest: '/dashboard/dispatcher/service-requests',
    suggestedRepair: '/dashboard/dispatcher/suggested-repairs'
  },
  finance: {
    serviceRequest: '/dashboard/admin/service-requests',
    suggestedRepair: '/dashboard/admin/suggested-repairs',
    invoice: '/dashboard/finance/invoice'
  },
  client: {
    serviceRequest: '/dashboard/client/service-requests',
    suggestedRepair: '/dashboard/client/service-requests',
    invoice: '/dashboard/client/invoices'
  }
};

/** Minimum gap between notification loads, so rapid navigation can't spam the API. */
const MIN_REFRESH_GAP_MS = 1500;
/** How often the counters refresh on their own so a new request shows up without navigating. */
const POLL_INTERVAL_MS = 30000;

interface NotificationSummary {
  newServiceRequests?: number;
  suggestedRepairsUnderReview?: number;
  invoicesDue?: number;
  total?: number;
}

interface DueInvoice {
  id: number;
  invoiceNumber: string;
  total: number;
  paidAmount: number;
  balance: number;
  status: string;
  dueDate: string | null;
  clientId: string | null;
  clientName: string | null;
}

const currency = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 0
});

@Injectable({ providedIn: 'root' })
export class SidebarNotificationService implements OnDestroy {
  private readonly serviceRequestCountState = signal(0);
  private readonly suggestedRepairCountState = signal(0);
  private readonly invoiceDueCountState = signal(0);
  private readonly invoiceDetailsState = signal<NotificationDetail[]>([]);

  readonly serviceRequestCount = this.serviceRequestCountState.asReadonly();
  readonly suggestedRepairCount = this.suggestedRepairCountState.asReadonly();
  readonly invoiceDueCount = this.invoiceDueCountState.asReadonly();
  readonly totalCount = computed(
    () => this.serviceRequestCountState() + this.suggestedRepairCountState() + this.invoiceDueCountState()
  );
  /** True once the first load finished, so the UI can tell "empty" from "not loaded yet". */
  readonly loaded = signal(false);

  private inFlight = false;
  private invoiceInFlight = false;
  private lastRefreshAt = 0;
  private pollTimer: ReturnType<typeof setInterval> | null = null;

  constructor(
    private http: HttpClient,
    private auth: AuthService,
    router: Router
  ) {
    // Navigation is a good moment to re-check the counters.
    router.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe(() => this.refresh());

    // The router subscription misses the very first navigation (this service is
    // created while the dashboard is being activated), so load once up front and
    // then keep polling. This is what makes the badge show on first page load.
    this.refresh(true);
    this.startPolling();
  }

  ngOnDestroy(): void {
    this.stopPolling();
  }

  get currentRole(): string {
    return (this.auth.getRole() || '').toLowerCase();
  }

  get canNotify(): boolean {
    return this.canNotifyWork || this.canNotifyInvoices;
  }

  get canNotifyWork(): boolean {
    return WORK_NOTIFICATION_ROLES.includes(this.currentRole);
  }

  get canNotifyInvoices(): boolean {
    return INVOICE_NOTIFICATION_ROLES.includes(this.currentRole);
  }

  routesForRole(role?: string | null): NotificationRoutes {
    const key = (role || this.currentRole || '').toLowerCase();
    return NOTIFICATION_ROUTES[key] || NOTIFICATION_ROUTES['admin'];
  }

  /**
   * Reload the counters from the dedicated summary endpoint. Throttled by default
   * so navigation and manual calls collapse into one request. Pass `true` to bypass.
   */
  refresh(force = false): void {
    if (!this.canNotify) {
      this.reset();
      return;
    }

    const now = Date.now();
    if (!force) {
      if (this.inFlight) return;
      if (now - this.lastRefreshAt < MIN_REFRESH_GAP_MS) return;
    }

    this.lastRefreshAt = now;
    this.inFlight = true;

    this.http
      .get<NotificationSummary>(`${API_BASE_URL}/Notifications/summary`)
      .pipe(
        catchError(err => {
          console.warn('[notifications] failed to load summary', err);
          return of(null);
        })
      )
      .subscribe({
        next: summary => {
          if (summary) {
            this.serviceRequestCountState.set(summary.newServiceRequests ?? 0);
            this.suggestedRepairCountState.set(summary.suggestedRepairsUnderReview ?? 0);
            this.invoiceDueCountState.set(summary.invoicesDue ?? 0);
            this.loaded.set(true);

            // Only pay for the second request when there is something to show.
            if ((summary.invoicesDue ?? 0) > 0) {
              this.loadInvoiceDetails();
            } else {
              this.invoiceDetailsState.set([]);
            }
          }
        },
        complete: () => {
          this.inFlight = false;
        }
      });
  }

  /** The invoice list behind the counter, so the dropdown can name the client and amount. */
  private loadInvoiceDetails(): void {
    if (this.invoiceInFlight || !this.canNotifyInvoices) return;
    this.invoiceInFlight = true;

    this.http
      .get<DueInvoice[]>(`${API_BASE_URL}/Notifications/invoices-due`)
      .pipe(
        catchError(err => {
          console.warn('[notifications] failed to load due invoices', err);
          return of([] as DueInvoice[]);
        })
      )
      .subscribe({
        next: invoices => {
          this.invoiceDetailsState.set(
            (invoices || []).map(invoice => this.toNotificationDetail(invoice))
          );
        },
        complete: () => {
          this.invoiceInFlight = false;
        }
      });
  }

  private toNotificationDetail(invoice: DueInvoice): NotificationDetail {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const due = invoice.dueDate ? new Date(invoice.dueDate) : null;
    const overdue = !!due && due.getTime() < today.getTime();

    const parts: string[] = [];
    // A client already knows who they are, so only staff need the name.
    if (invoice.clientName) parts.push(invoice.clientName);
    parts.push(overdue ? 'Overdue' : 'Due');
    if (due) {
      parts.push(due.toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' }));
    }
    parts.push(currency.format(invoice.balance));

    return {
      id: invoice.id,
      title: invoice.invoiceNumber || `#${invoice.id}`,
      meta: parts.join(' · '),
      amount: invoice.balance,
      overdue
    };
  }

  /** Force an immediate reload, bypassing the throttle. */
  refreshNow(): void {
    this.refresh(true);
  }

  reset(): void {
    this.serviceRequestCountState.set(0);
    this.suggestedRepairCountState.set(0);
    this.invoiceDueCountState.set(0);
    this.invoiceDetailsState.set([]);
    this.loaded.set(false);
    this.stopPolling();
  }

  getNotificationItems(role?: string | null): SidebarNotification[] {
    const key = (role || this.currentRole || '').toLowerCase();
    const routes = this.routesForRole(role);
    const items: SidebarNotification[] = [];

    if (WORK_NOTIFICATION_ROLES.includes(key)) {
      items.push(
        {
          key: 'service-request',
          label: 'New service requests',
          count: this.serviceRequestCountState(),
          route: routes.serviceRequest
        },
        {
          key: 'suggested-repair',
          label: 'Suggested repairs under review',
          count: this.suggestedRepairCountState(),
          route: routes.suggestedRepair
        }
      );
    }

    if (INVOICE_NOTIFICATION_ROLES.includes(key) && routes.invoice) {
      items.push({
        key: 'invoice-due',
        label: 'Invoices due for payment',
        count: this.invoiceDueCountState(),
        route: routes.invoice,
        details: this.invoiceDetailsState()
      });
    }

    return items.filter(item => item.count > 0);
  }

  get notificationItems(): SidebarNotification[] {
    return this.getNotificationItems();
  }

  private startPolling(): void {
    if (this.pollTimer || !this.canNotify) return;
    this.pollTimer = setInterval(() => {
      // Only poll while the tab is visible, no point burning requests in background.
      if (typeof document === 'undefined' || document.visibilityState === 'visible') {
        this.refresh();
      }
    }, POLL_INTERVAL_MS);
  }

  private stopPolling(): void {
    if (this.pollTimer) {
      clearInterval(this.pollTimer);
      this.pollTimer = null;
    }
  }
}
