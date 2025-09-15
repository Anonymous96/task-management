import {
  ApplicationConfig,
  provideZoneChangeDetection,
  importProvidersFrom,
} from '@angular/core';
import { provideRouter } from '@angular/router';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { NbThemeModule, NbSidebarModule } from '@nebular/theme';
import { provideHttpClient, withInterceptors } from '@angular/common/http';

import { appRoutes } from './app.routes';
import { ErrorInterceptor, LoggingInterceptor } from '@loginsvi/infrastructure';

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(appRoutes),
    provideHttpClient(withInterceptors([ErrorInterceptor, LoggingInterceptor])),
    importProvidersFrom(
      BrowserAnimationsModule,
      NbThemeModule.forRoot({ name: 'default' }),
      NbSidebarModule.forRoot()
    ),
  ],
};
