import { Injectable, inject, signal } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';
import { CarDataService } from './car-data.service';
import { MapService } from './map.service';
import { Car } from '../models/car.model';

@Injectable({
  providedIn: 'root'
})
export class NavigationService {
  private router = inject(Router);
  private carDataService = inject(CarDataService);
  private mapService = inject(MapService);

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
    const car = this.carDataService.getCar(carId);
    
    if (car) {
      // Select the car in the car data service
      this.carDataService.selectCar(carId);
      
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
    
    // Set the map center and zoom
    this.mapService.setMapCenter(latitude, longitude);
    if (zoom) {
      this.mapService.setMapZoom(zoom);
    }
    
    // Navigate to the map view
    this.router.navigate(['/map'], { 
      queryParams: { 
        lat: latitude, 
        lng: longitude,
        zoom: zoom || this.mapService.mapZoom()
      }
    });
  }

  /**
   * Parse URL parameters to set initial map state
   * @param params URL parameters
   */
  parseMapParams(params: any): void {
    if (params.lat && params.lng) {
      const lat = parseFloat(params.lat);
      const lng = parseFloat(params.lng);
      const zoom = params.zoom ? parseInt(params.zoom, 10) : undefined;
      
      if (!isNaN(lat) && !isNaN(lng)) {
        this.mapService.setMapCenter(lat, lng);
        
        if (zoom && !isNaN(zoom)) {
          this.mapService.setMapZoom(zoom);
        }
      }
    }
  }

  /**
   * Handle deep linking to a specific car
   * @param carId The ID of the car
   */
  handleCarDeepLink(carId: string): void {
    const car = this.carDataService.getCar(carId);
    
    if (car) {
      // Select the car
      this.carDataService.selectCar(carId);
      
      // Center the map on the car's location
      this.mapService.setMapCenter(car.latitude, car.longitude);
      this.mapService.setMapZoom(16); // Zoom in to see the car clearly
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