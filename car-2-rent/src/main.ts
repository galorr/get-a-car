import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { AppComponent } from './app/app.component';
import { NgZone } from '@angular/core';

// Custom NoopNgZone for zoneless operation
class NoopNgZone extends NgZone {
  constructor() {
    super({ enableLongStackTrace: false, shouldCoalesceEventChangeDetection: false });
  }

  run<T>(fn: (...args: any[]) => T, applyThis?: any, applyArgs?: any[]): T {
    return fn.apply(applyThis, applyArgs);
  }

  runTask<T>(fn: (...args: any[]) => T, applyThis?: any, applyArgs?: any[], name?: string): T {
    return fn.apply(applyThis, applyArgs);
  }

  runGuarded<T>(fn: (...args: any[]) => T, applyThis?: any, applyArgs?: any[]): T {
    return fn.apply(applyThis, applyArgs);
  }

  runOutsideAngular<T>(fn: (...args: any[]) => T): T {
    return fn();
  }

  get onStable() {
    return new EventTarget() as any;
  }

  get onUnstable() {
    return new EventTarget() as any;
  }

  get onError() {
    return new EventTarget() as any;
  }

  get onMicrotaskEmpty() {
    return new EventTarget() as any;
  }
}

// Bootstrap the application with zoneless configuration
bootstrapApplication(AppComponent, {
  ...appConfig,
  providers: [
    ...appConfig.providers || [],
    { provide: NgZone, useClass: NoopNgZone }
  ]
}).catch(err => console.error('Error bootstrapping application:', err));