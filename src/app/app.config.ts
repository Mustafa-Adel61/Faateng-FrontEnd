import { ApplicationConfig, inject, provideAppInitializer, provideBrowserGlobalErrorListeners, provideZoneChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';

import { routes } from './app.routes';
import { authInterceptor } from './core/auth.interceptor';
import { SidebarNotificationService } from './core/sidebar-notification.service';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),
    provideHttpClient(withInterceptors([authInterceptor])),
    // Start loading the notification counters as soon as the app boots, in parallel
    // with the first page load, so the header bell / sidebar badges are already
    // populated the moment the dashboard renders - no navigation required.
    provideAppInitializer(() => {
      inject(SidebarNotificationService).refresh(true);
    })
  ]
};
