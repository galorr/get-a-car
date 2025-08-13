import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { AppComponent } from './app/app.component';
import { provideZonelessChangeDetection } from '@angular/core';

// Bootstrap the application with zoneless configuration
bootstrapApplication(AppComponent, {
  ...appConfig,
  providers: [
    ...appConfig.providers || [],
    provideZonelessChangeDetection()
  ]
}).catch(err => console.error('Error bootstrapping application:', err));
