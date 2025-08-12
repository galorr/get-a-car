import { Injectable, inject, signal } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';
import { DataService } from './data.service';
import { Car } from '../models/car.model';

@Injectable({
  providedIn: 'root'
})
export class NavigationService {
  private router = inject(Router);
  private dataService = inject(DataService);

  // Signal to track current route
  currentRoute = signal<string>('');

  // Signal to track loading state during navigation
  isNavigating = signal<boolean>(false);

  constructor() {
    // Track navigation events to update current route
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe((event: any) => {
      this.currentRoute.set(event.urlAfterRedirects);
      this.isNavigating.set(false);
    });
  }

  /**
   * Navigate to the map view
   */
  navigateToMap(): void {
    this.isNavigating.set(true);
    this.router.navigate(['/map']);
  }

  /**
   * Navigate to the cars grid view
   */
  navigateToCars(): void {
    this.isNavigating.set(true);
    this.router.navigate(['/cars']);
  }

  /**
   * Navigate to the registration view
   */
  navigateToRegistration(): void {
    this.isNavigating.set(true);
    this.router.navigate(['/register']);
  }

  /**
   * Navigate to a specific car by ID
   * @param carId The ID of the car to navigate to
   */
  navigateToCar(carId: string): void {
    this.isNavigating.set(true);

    // Get the car data
    const car = this.dataService.cars().find(car => car.id === carId);

    if (car) {
      // Select the car in the data service
      this.dataService.selectCar(carId);

      // Navigate to the car route
      this.router.navigate(['/car', carId]);
    } else {
      console.error(`Car with ID ${carId} not found`);
      this.navigateToMap();
    }
  }

  /**
   * Navigate to a specific location on the map
   * @param latitude The latitude coordinate
   * @param longitude The longitude coordinate
   * @param zoom Optional zoom level
   */
  navigateToLocation(latitude: number, longitude: number, zoom?: number): void {
    this.isNavigating.set(true);

    // Navigate to the map view with query parameters
    this.router.navigate(['/map'], {
      queryParams: {
        lat: latitude,
        lng: longitude,
        zoom: zoom || 13 // Default zoom level
      }
    });
  }

  /**
   * Parse URL parameters to set initial map state
   * @param params URL parameters
   */
  parseMapParams(params: any): { lat: number, lng: number, zoom?: number } | null {
    if (params.lat && params.lng) {
      const lat = parseFloat(params.lat);
      const lng = parseFloat(params.lng);
      const zoom = params.zoom ? parseInt(params.zoom, 10) : undefined;

      if (!isNaN(lat) && !isNaN(lng)) {
        return {
          lat,
          lng,
          ...(zoom !== undefined && !isNaN(zoom) ? { zoom } : {})
        };
      }
    }
    return null;
  }

  /**
   * Handle deep linking to a specific car
   * @param carId The ID of the car
   */
  handleCarDeepLink(carId: string): void {
    const car = this.dataService.cars().find(car => car.id === carId);

    if (car) {
      // Select the car
      this.dataService.selectCar(carId);
    }
  }

  /**
   * Get the URL for a car
   * @param car The car object
   * @returns The URL for the car
   */
  getCarUrl(car: Car): string {
    return `/car/${car.id}`;
  }

  /**
   * Get the URL for a location
   * @param latitude The latitude coordinate
   * @param longitude The longitude coordinate
   * @param zoom Optional zoom level
   * @returns The URL for the location
   */
  getLocationUrl(latitude: number, longitude: number, zoom?: number): string {
    let url = `/map?lat=${latitude}&lng=${longitude}`;
    if (zoom) {
      url += `&zoom=${zoom}`;
    }
    return url;
  }
}
