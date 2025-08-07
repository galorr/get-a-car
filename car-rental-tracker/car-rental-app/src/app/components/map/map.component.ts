import { Component, AfterViewInit, OnDestroy, inject, signal, effect, ChangeDetectorRef, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import * as L from 'leaflet';
import { CarDataService } from '../../services/car-data.service';
import { MapService } from '../../services/map.service';
import { Car, CarStatus } from '../../models/car.model';

@Component({
  selector: 'app-map',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './map.component.html',
  styleUrls: ['./map.component.scss']
})
export class MapComponent implements AfterViewInit, OnDestroy {
  private map!: L.Map;
  private markers = new Map<string, L.Marker>();
  private markerGroup!: L.LayerGroup;
  private selectedCarId = signal<string | null>(null);

  private carDataService = inject(CarDataService);
  private mapService = inject(MapService);
  private cdr = inject(ChangeDetectorRef);

  // Filter states
  private statusFilters = {
    [CarStatus.AVAILABLE]: true,
    [CarStatus.RENTED]: true,
    [CarStatus.MAINTENANCE]: true,
    [CarStatus.INACTIVE]: true
  };

  ngAfterViewInit(): void {
    // Initialize the map
    this.initializeMap();

    // Subscribe to car data changes using signals
    effect(() => {
      const cars = this.carDataService.allCars();
      this.updateMarkers(cars);
    });
  }

  ngOnDestroy(): void {
    // Clean up the map when the component is destroyed
    if (this.map) {
      this.map.remove();
    }
  }

  private initializeMap(): void {
    // Create the map
    this.map = this.mapService.initializeMap('map');

    // Create marker group
    this.markerGroup = this.mapService.createMarkerGroup();
    this.markerGroup.addTo(this.map);

    // Add filter control
    const filterControl = this.mapService.createFilterControl();
    filterControl.addTo(this.map);

    // Add event listener for filter changes
    setTimeout(() => {
      const filterOptions = document.querySelectorAll('.filter-options input[type="checkbox"]');
      filterOptions.forEach(checkbox => {
        checkbox.addEventListener('change', (event) => {
          const target = event.target as HTMLInputElement;
          const status = target.dataset['status'] as CarStatus;
          this.statusFilters[status] = target.checked;
          this.updateMarkerVisibility();
          this.cdr.detectChanges();
        });
      });
    }, 100);

    // Load initial car data
    this.carDataService.loadCars().subscribe();
  }

  private updateMarkers(cars: Car[]): void {
    // Remove markers that no longer exist
    this.markers.forEach((marker, id) => {
      if (!cars.some(car => car.id === id)) {
        this.markerGroup.removeLayer(marker);
        this.markers.delete(id);
      }
    });

    // Update existing markers and add new ones
    cars.forEach(car => {
      if (this.markers.has(car.id)) {
        // Update existing marker
        const marker = this.markers.get(car.id)!;
        this.mapService.updateMarkerPosition(marker, car.latitude, car.longitude);
        this.mapService.updateMarkerIcon(marker, car.status);
        marker.setPopupContent(this.createPopupContent(car));
      } else {
        // Create new marker
        const marker = this.mapService.createCarMarker(car, this.map);
        this.markers.set(car.id, marker);

        // Add popup open event
        marker.on('popupopen', () => {
          setTimeout(() => {
            const trackButton = document.querySelector(`.track-button[data-car-id="${car.id}"]`);
            if (trackButton) {
              trackButton.addEventListener('click', () => {
                this.selectCar(car.id);
                this.cdr.detectChanges();
              });
            }
          }, 10);
        });
      }
    });

    // Update marker visibility based on filters
    this.updateMarkerVisibility();

    // Fit map to markers if needed
    if (cars.length > 0 && this.markers.size > 0) {
      this.mapService.fitMapToMarkers(this.map, Array.from(this.markers.values()));
    }

    // Manually trigger change detection
    this.cdr.detectChanges();
  }

  private updateMarkerVisibility(): void {
    // Clear all markers from the group
    this.markerGroup.clearLayers();

    // Add only the markers that match the filter
    this.markers.forEach((marker, id) => {
      const car = this.carDataService.getCar(id);
      if (car && this.statusFilters[car.status]) {
        this.markerGroup.addLayer(marker);
      }
    });
  }

  private selectCar(carId: string): void {
    this.selectedCarId.set(carId);

    // Emit an event to notify parent components
    // In a real application, you would use an EventEmitter or a service
    console.log('Selected car:', carId);

    // You could also highlight the marker
    const marker = this.markers.get(carId);
    if (marker) {
      marker.openPopup();
    }
  }

  private createPopupContent(car: Car): string {
    return `
      <div class="car-popup">
        <h3>${car.name}</h3>
        <p><strong>ID:</strong> ${car.id}</p>
        <p><strong>Status:</strong> ${car.status}</p>
        <p><strong>Last Updated:</strong> ${new Date(car.lastUpdated).toLocaleString()}</p>
        <button class="track-button" data-car-id="${car.id}">Track This Car</button>
      </div>
    `;
  }

  @HostListener('window:resize')
  onResize(): void {
    // Update map size when window resizes
    if (this.map) {
      this.map.invalidateSize();
    }
  }
}
