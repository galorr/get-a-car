import { Injectable, inject } from '@angular/core';
import { CanActivate, ActivatedRouteSnapshot, RouterStateSnapshot, Router } from '@angular/router';
import { Observable, of, catchError, map, tap, finalize, forkJoin, timeout } from 'rxjs';
import { DataService } from '../services/data.service';
import { CarDataService } from '../services/car-data.service';
import { RegistrationService } from '../services/registration.service';

@Injectable({
  providedIn: 'root'
})
export class DataLoadedGuard implements CanActivate {
  private dataService = inject(DataService);
  private carDataService = inject(CarDataService);
  private registrationService = inject(RegistrationService);
  private router = inject(Router);

  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): Observable<boolean> {
    console.log('[DataLoadedGuard] canActivate called for route:', route.routeConfig?.path);
    console.log('[DataLoadedGuard] Current navigation state:', state.url);

    // DIAGNOSTIC: Check if services are properly injected
    console.log('[DataLoadedGuard] DIAGNOSTIC: Service instances:', {
      dataService: !!this.dataService,
      carDataService: !!this.carDataService,
      registrationService: !!this.registrationService,
      router: !!this.router
    });

    // Check if car data is loaded
    const cars = this.carDataService.getCars();
    console.log('[DataLoadedGuard] Current car data status:', { count: cars.length, loaded: cars && cars.length > 0 });

    if (cars && cars.length > 0) {
      // Data is already loaded, allow access
      console.log('[DataLoadedGuard] Car data already loaded, allowing navigation');
      return of(true);
    } else {
      // Data is not loaded, try to load it
      console.log('[DataLoadedGuard] Car data not loaded, attempting to load...');
      console.log('[DataLoadedGuard] DIAGNOSTIC: About to call forkJoin for data loading');

      // Load both cars and users data concurrently and wait for both to complete
      return forkJoin({
        cars: this.dataService.loadCars(),
        users: this.dataService.loadUsers()
      }).pipe(
        // Add a timeout to prevent infinite loading
        timeout(10000), // 10 seconds timeout
        map(results => {
          console.log('[DataLoadedGuard] DIAGNOSTIC: Inside map operator after forkJoin');
          const carsLoaded = results.cars.length > 0;
          const usersLoaded = results.users.length > 0;

          console.log(`[DataLoadedGuard] Data loading completed:`, {
            carsLoaded,
            usersLoaded,
            carsCount: results.cars.length,
            usersCount: results.users.length
          });

          // Return true only if both cars and users are loaded
          if (carsLoaded && usersLoaded) {
            // Update the services with the loaded data
            this.carDataService.updateCars(results.cars);
            this.registrationService.updateUsers(results.users);
            return true;
          }
          return false;
        }),
        tap(dataLoaded => {
          console.log('[DataLoadedGuard] DIAGNOSTIC: Inside tap operator, dataLoaded =', dataLoaded);
          if (!dataLoaded) {
            console.warn('[DataLoadedGuard] Failed to load data, redirecting to map view');
            this.router.navigate(['/map']);
          } else {
            console.log('[DataLoadedGuard] Data loaded successfully, allowing navigation');
          }
        }),
        catchError(error => {
          console.error('[DataLoadedGuard] Error loading data:', error);
          console.error('[DataLoadedGuard] DIAGNOSTIC: Detailed error in guard:', {
            name: (error as any).name,
            message: (error as any).message,
            stack: (error as any).stack
          });

          // Check if it's a timeout error
          if (error.name === 'TimeoutError') {
            console.error('[DataLoadedGuard] Loading timed out after 10 seconds');
          }

          this.router.navigate(['/map']);
          return of(false);
        }),
        finalize(() => {
          console.log('[DataLoadedGuard] canActivate guard processing completed');
          console.log('[DataLoadedGuard] DIAGNOSTIC: Guard finalize callback executed');
        })
      );
    }
  }
}
