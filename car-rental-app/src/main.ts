import { bootstrapApplication } from '@angular/platform-browser';
import { AppComponent } from './app/app';
import { appConfig } from './app/app.config';
import { provideZonelessChangeDetection } from '@angular/core';

// Bootstrap the application in zoneless mode
bootstrapApplication(AppComponent, {
  ...appConfig,
  providers: [
    ...appConfig.providers,
    provideZonelessChangeDetection()
  ]
})
  .catch(err => console.error(err));
