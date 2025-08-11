import { Injectable, inject } from '@angular/core';
import { CanActivate, ActivatedRouteSnapshot, RouterStateSnapshot, Router } from '@angular/router';
import { Observable, of, catchError, map, tap, finalize } from 'rxjs';
import { CarDataService } from '../services/car-data.service';
import { RegistrationService } from '../services/registration.service';

@Injectable({
  providedIn: 'root'
})
export class DataLoadedGuard implements CanActivate {
  private carDataService = inject(CarDataService);
  private registrationService = inject(RegistrationService);
  private router = inject(Router);

  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): Observable<boolean> {
    // Check if car data is loaded
    const cars = this.carDataService.getCars();
    
    if (cars && cars.length > 0) {
      // Data is already loaded, allow access
      return of(true);
    } else {
      // Data is not loaded, try to load it
      console.log('Car data not loaded, attempting to load...');
      
      return this.carDataService.loadCars().pipe(
        tap(loadedCars => {
          console.log(`Loaded ${loadedCars.length} cars`);
          
          // Also load users data
          this.registrationService.loadUsers().subscribe({
            next: users => console.log(`Loaded ${users.length} users`),
            error: err => console.error('Error loading users:', err)
          });
        }),
        map(loadedCars => loadedCars.length > 0),
        tap(hasData => {
          if (!hasData) {
            console.warn('Failed to load car data, redirecting to map view');
            this.router.navigate(['/map']);
          }
        }),
        catchError(error => {
          console.error('Error loading car data:', error);
          this.router.navigate(['/map']);
          return of(false);
        })
      );
    }
  }
}