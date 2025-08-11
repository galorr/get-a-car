import { Injectable, signal, computed, inject, effect } from '@angular/core';
import * as L from 'leaflet';
import { Car, CarStatus, CarLocation } from '../models/car.model';
import { CarDataService } from './car-data.service';
import { environment } from '../../environments/environment';
import { Observable, of, throwError, catchError, finalize } from 'rxjs';

export interface MapMarker {
  id: string;
  marker: L.Marker;
  status: CarStatus;
}

export interface MapBounds {
  north: number;
  south: number;
  east: number;
  west: number;
}

export interface ClusterOptions {
  enabled: boolean;
  maxClusterRadius: number;
  disableClusteringAtZoom: number;
}

@Injectable({
  providedIn: 'root'
})
export class MapService {
  // Signal for map center
  private mapCenterSignal = signal<[number, number]>([
    environment.mapDefaultCenter[0] as number, 
    environment.mapDefaultCenter[1] as number
  ]);
  
  // Signal for map zoom level
  private mapZoomSignal = signal<number>(environment.mapDefaultZoom);
  
  // Signal for visible status filters
  private visibleStatusesSignal = signal<CarStatus[]>([
    CarStatus.AVAILABLE,
    CarStatus.RENTED,
    CarStatus.MAINTENANCE,
    CarStatus.INACTIVE
  ]);
  
  // Signal for map markers
  private markersSignal = signal<Map<string, MapMarker>>(new Map());
  
  // Signal for loading state
  private loadingSignal = signal<boolean>(false);
  
  // Signal for error state
  private errorSignal = signal<string | null>(null);
  
  // Signal for map bounds
  private mapBoundsSignal = signal<MapBounds | null>(null);
  
  // Signal for cluster options
  private clusterOptionsSignal = signal<ClusterOptions>({
    enabled: true,
    maxClusterRadius: 80,
    disableClusteringAtZoom: 18
  });
  
  // Signal for selected marker
  private selectedMarkerIdSignal = signal<string | null>(null);
  
  // Computed signal for map center
  public mapCenter = computed(() => this.mapCenterSignal());
  
  // Computed signal for map zoom
  public mapZoom = computed(() => this.mapZoomSignal());
  
  // Computed signal for visible statuses
  public visibleStatuses = computed(() => this.visibleStatusesSignal());
  
  // Computed signal for markers
  public markers = computed(() => this.markersSignal());
  
  // Computed signal for loading state
  public isLoading = computed(() => this.loadingSignal());
  
  // Computed signal for error state
  public error = computed(() => this.errorSignal());
  
  // Computed signal for map bounds
  public mapBounds = computed(() => this.mapBoundsSignal());
  
  // Computed signal for cluster options
  public clusterOptions = computed(() => this.clusterOptionsSignal());
  
  // Computed signal for selected marker
  public selectedMarkerId = computed(() => this.selectedMarkerIdSignal());
  
  // Computed signal for visible markers
  public visibleMarkers = computed(() => {
    const markers = this.markersSignal();
    const visibleStatuses = this.visibleStatusesSignal();
    
    return Array.from(markers.values()).filter(marker => 
      visibleStatuses.includes(marker.status)
    );
  });
  
  // Computed signal for markers count by status
  public markersCountByStatus = computed(() => {
    const markers = this.markersSignal();
    const counts = {
      [CarStatus.AVAILABLE]: 0,
      [CarStatus.RENTED]: 0,
      [CarStatus.MAINTENANCE]: 0,
      [CarStatus.INACTIVE]: 0,
      total: 0
    };
    
    markers.forEach(marker => {
      counts[marker.status]++;
      counts.total++;
    });
    
    return counts;
  });
  
  private carDataService = inject(CarDataService);
  
  constructor() {
    // Setup effect to update markers when car data changes
    effect(() => {
      const cars = this.carDataService.getCars();
      this.updateMarkersFromCars(cars);
    });
    
    // Setup effect to handle selected car
    effect(() => {
      const selectedCar = this.carDataService.selectedCar();
      if (selectedCar) {
        this.selectMarker(selectedCar.id);
        this.setMapCenter(selectedCar.latitude, selectedCar.longitude);
      } else {
        this.selectMarker(null);
      }
    });
  }
  
  /**
   * Set map center
   */
  setMapCenter(latitude: number, longitude: number): void {
    this.mapCenterSignal.set([latitude, longitude]);
  }
  
  /**
   * Set map zoom
   */
  setMapZoom(zoom: number): void {
    this.mapZoomSignal.set(zoom);
  }
  
  /**
   * Set map bounds
   */
  setMapBounds(bounds: MapBounds): void {
    this.mapBoundsSignal.set(bounds);
  }
  
  /**
   * Clear map bounds
   */
  clearMapBounds(): void {
    this.mapBoundsSignal.set(null);
  }
  
  /**
   * Toggle status visibility
   */
  toggleStatusVisibility(status: CarStatus): void {
    this.visibleStatusesSignal.update(statuses => {
      if (statuses.includes(status)) {
        return statuses.filter(s => s !== status);
      } else {
        return [...statuses, status];
      }
    });
  }
  
  /**
   * Set visible statuses
   */
  setVisibleStatuses(statuses: CarStatus[]): void {
    this.visibleStatusesSignal.set(statuses);
  }
  
  /**
   * Check if a status is visible
   */
  isStatusVisible(status: CarStatus): boolean {
    return this.visibleStatusesSignal().includes(status);
  }
  
  /**
   * Update cluster options
   */
  updateClusterOptions(options: Partial<ClusterOptions>): void {
    this.clusterOptionsSignal.update(currentOptions => ({
      ...currentOptions,
      ...options
    }));
  }
  
  /**
   * Select a marker
   */
  selectMarker(id: string | null): void {
    this.selectedMarkerIdSignal.set(id);
    
    // Also select the car in the car data service
    if (id !== this.carDataService.selectedCar()?.id) {
      this.carDataService.selectCar(id);
    }
  }
  
  /**
   * Get marker icon based on car status
   */
  getMarkerIcon(status: CarStatus): L.Icon {
    // Create custom icons based on car status
    const iconUrl = {
      [CarStatus.AVAILABLE]: 'assets/images/marker-green.png',
      [CarStatus.RENTED]: 'assets/images/marker-blue.png',
      [CarStatus.MAINTENANCE]: 'assets/images/marker-orange.png',
      [CarStatus.INACTIVE]: 'assets/images/marker-gray.png'
    }[status];
    
    return L.icon({
      iconUrl,
      iconSize: [25, 41],
      iconAnchor: [12, 41],
      popupAnchor: [1, -34]
    });
  }
  
  /**
   * Create popup content for a car
   */
  createPopupContent(car: Car): string {
    return `
      <div class="car-popup">
        <h3>${car.name}</h3>
        <p><strong>ID:</strong> ${car.id}</p>
        <p><strong>Status:</strong> ${car.status}</p>
        ${car.model ? `<p><strong>Model:</strong> ${car.model}</p>` : ''}
        ${car.year ? `<p><strong>Year:</strong> ${car.year}</p>` : ''}
        ${car.licensePlate ? `<p><strong>License Plate:</strong> ${car.licensePlate}</p>` : ''}
        ${car.type ? `<p><strong>Type:</strong> ${car.type}</p>` : ''}
        ${car.fuelLevel !== undefined ? `<p><strong>Fuel Level:</strong> ${car.fuelLevel}%</p>` : ''}
        ${car.mileage !== undefined ? `<p><strong>Mileage:</strong> ${car.mileage} km</p>` : ''}
        <p><strong>Last Updated:</strong> ${new Date(car.lastUpdated).toLocaleString()}</p>
        <button class="track-button" data-car-id="${car.id}">Track This Car</button>
      </div>
    `;
  }
  
  /**
   * Calculate bounds for a collection of cars
   */
  calculateBounds(cars: Car[]): L.LatLngBounds | null {
    if (cars.length === 0) {
      return null;
    }
    
    const latLngs = cars.map(car => L.latLng(car.latitude, car.longitude));
    return L.latLngBounds(latLngs);
  }
  
  /**
   * Update markers from cars
   */
  updateMarkersFromCars(cars: Car[]): void {
    this.markersSignal.update(markers => {
      const newMarkers = new Map(markers);
      
      // Update existing markers and add new ones
      cars.forEach(car => {
        const position = L.latLng(car.latitude, car.longitude);
        
        if (newMarkers.has(car.id)) {
          // Update existing marker
          const marker = newMarkers.get(car.id)!;
          marker.marker.setLatLng(position);
          marker.status = car.status;
          marker.marker.setIcon(this.getMarkerIcon(car.status));
          marker.marker.bindPopup(this.createPopupContent(car));
        } else {
          // Create new marker
          const icon = this.getMarkerIcon(car.status);
          const marker = L.marker(position, { icon });
          marker.bindPopup(this.createPopupContent(car));
          
          newMarkers.set(car.id, {
            id: car.id,
            marker,
            status: car.status
          });
        }
      });
      
      // Remove markers for cars that no longer exist
      const carIds = new Set(cars.map(car => car.id));
      Array.from(newMarkers.keys()).forEach(id => {
        if (!carIds.has(id)) {
          newMarkers.delete(id);
        }
      });
      
      return newMarkers;
    });
  }
  
  /**
   * Refresh car locations from API
   */
  refreshCarLocations(): Observable<CarLocation[]> {
    this.loadingSignal.set(true);
    this.errorSignal.set(null);
    
    return this.carDataService.getAllCarLocations().pipe(
      catchError(error => {
        console.error('Error refreshing car locations:', error);
        this.errorSignal.set('Failed to refresh car locations. Please try again later.');
        return throwError(() => error);
      }),
      finalize(() => this.loadingSignal.set(false))
    );
  }
  
  /**
   * Fit map to markers
   */
  fitMapToMarkers(): MapBounds | null {
    const markers = this.visibleMarkers();
    
    if (markers.length === 0) {
      return null;
    }
    
    const latLngs = markers.map(marker => marker.marker.getLatLng());
    const bounds = L.latLngBounds(latLngs);
    
    const mapBounds: MapBounds = {
      north: bounds.getNorth(),
      south: bounds.getSouth(),
      east: bounds.getEast(),
      west: bounds.getWest()
    };
    
    this.setMapBounds(mapBounds);
    return mapBounds;
  }
  
  /**
   * Fit map to specific car
   */
  fitMapToCar(carId: string): boolean {
    const car = this.carDataService.getCar(carId);
    
    if (!car) {
      return false;
    }
    
    this.setMapCenter(car.latitude, car.longitude);
    this.setMapZoom(18); // Zoom in close to the car
    this.selectMarker(carId);
    
    return true;
  }
  
  /**
   * Get markers within bounds
   */
  getMarkersWithinBounds(bounds: MapBounds): MapMarker[] {
    const visibleMarkers = this.visibleMarkers();
    
    return visibleMarkers.filter(marker => {
      const latLng = marker.marker.getLatLng();
      return (
        latLng.lat <= bounds.north &&
        latLng.lat >= bounds.south &&
        latLng.lng <= bounds.east &&
        latLng.lng >= bounds.west
      );
    });
  }
  
  /**
   * Clear error
   */
  clearError(): void {
    this.errorSignal.set(null);
  }
}