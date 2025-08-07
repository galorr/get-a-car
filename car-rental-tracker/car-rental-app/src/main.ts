import { bootstrapApplication } from '@angular/platform-browser';
import { AppComponent } from './app/app';
import { appConfig } from './app/app.config';
import { NgZone, ɵNoopNgZone as NoopNgZone } from '@angular/core';

// Bootstrap the application in zoneless mode
bootstrapApplication(AppComponent, {
  ...appConfig,
  providers: [
    ...appConfig.providers,
    { provide: NgZone, useClass: NoopNgZone }
  ]
})
  .catch(err => console.error(err));
