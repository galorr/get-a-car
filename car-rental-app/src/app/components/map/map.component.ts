import { Component, AfterViewInit, OnDestroy, inject, signal, computed, effect, HostListener, input, output, model } from '@angular/core';
import { CommonModule } from '@angular/common';
import * as L from 'leaflet';
import { CarDataService } from '../../services/car-data.service';
import { MapService } from '../../services/map.service';
import { Car, CarStatus } from '../../models/car.model';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

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

  // Signal state
  private selectedCarId = signal<string | null>(null);

  // Input to receive selected car from parent component using signal input
  selectedCar = input<Car | null>(null);

  // Computed signal to check if a car is selected
  hasSelectedCar = computed(() => !!this.selectedCar());

  // Filter states using signals
  private statusFilters = signal({
    [CarStatus.AVAILABLE]: true,
    [CarStatus.RENTED]: true,
    [CarStatus.MAINTENANCE]: true,
    [CarStatus.INACTIVE]: true
  });

  // Computed signal for filtered cars
  filteredCars = computed(() => {
    const filters = this.statusFilters();
    return this.carDataService.allCars().filter(car => filters[car.status]);
  });

  // Services
  private carDataService = inject(CarDataService);
  private mapService = inject(MapService);

  constructor() {
    // Subscribe to car data changes using signals
    effect(() => {
      const cars = this.filteredCars();
      if (this.map && this.markerGroup) {
        this.updateMarkers(cars);
      }
    });

    // Effect to handle selected car changes
    effect(() => {
      const car = this.selectedCar();
      if (car) {
        this.focusOnCar(car.id);
      }
    });
  }

  ngAfterViewInit(): void {
    // Initialize the map
    this.initializeMap();
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

          // Update status filters using signal
          this.statusFilters.update(filters => ({
            ...filters,
            [status]: target.checked
          }));
        });
      });
    }, 100);

    // Load initial car data
    this.carDataService.loadCars();
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
              });
            }
          }, 10);
        });
      }
    });

    // Fit map to markers if needed
    if (cars.length > 0 && this.markers.size > 0) {
      this.mapService.fitMapToMarkers(this.map, Array.from(this.markers.values()));
    }
  }

  private selectCar(carId: string): void {
    this.selectedCarId.set(carId);

    // Emit an event to notify parent components
    // In a real application, you would use an EventEmitter or a service
    console.log('Selected car:', carId);

    // Focus on the selected car
    this.focusOnCar(carId);
  }

  /**
   * Focus the map on a specific car
   */
  public focusOnCar(carId: string): void {
    const marker = this.markers.get(carId);
    if (marker) {
      // Zoom to the marker
      this.map.setView(marker.getLatLng(), 16);

      // Open the popup
      marker.openPopup();

      // Highlight the marker (you could add additional styling here)
      this.selectedCarId.set(carId);
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
