import { CommonModule } from '@angular/common';
import type { AfterViewInit } from '@angular/core';
import {
  Component,
  signal,
  inject,
  HostListener,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  effect,
  runInInjectionContext,
  Injector,
} from '@angular/core';
import * as L from 'leaflet';

import 'leaflet.markercluster';
import type { Car, CarStatus } from '../../models/car.model';
import { CarDataService } from '../../services/car-data.service';
import { MapService } from '../../services/map.service';

@Component({
  selector: 'app-map',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './map.component.html',
  styleUrls: ['./map.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MapComponent implements AfterViewInit {
  private map!: L.Map;
  private markers = new Map<string, L.Marker>();
  private markerClusterGroup!: L.MarkerClusterGroup;

  private carDataService = inject(CarDataService);
  private mapService = inject(MapService);
  private cdr = inject(ChangeDetectorRef);
  private injector = inject(Injector);

  // Signal for selected car
  selectedCarId = signal<string | null>(null);

  constructor() {
    // Setup effect to track selected car changes
    runInInjectionContext(this.injector, () => {
      effect(() => {
        const selectedCar = this.carDataService.selectedCar();
        if (selectedCar) {
          this.selectedCarId.set(selectedCar.id);
          this.highlightSelectedCar(selectedCar.id);
        } else {
          this.selectedCarId.set(null);
          this.clearHighlightedCars();
        }
      });
    });
  }

  ngAfterViewInit(): void {
    this.initializeMap();

    // Setup effect to track car data changes
    runInInjectionContext(this.injector, () => {
      effect(() => {
        const cars = this.carDataService.getCars();
        this.updateMarkers(cars);
        this.cdr.detectChanges();
      });
    });
  }

  private initializeMap(): void {
    const mapCenter = this.mapService.mapCenter();
    const mapZoom = this.mapService.mapZoom();

    this.map = L.map('map', {
      zoomControl: false, // Custom position for zoom control
      attributionControl: false, // Custom position for attribution
    }).setView(mapCenter, mapZoom);

    // Add custom positioned controls
    L.control
      .zoom({
        position: 'topright',
      })
      .addTo(this.map);

    L.control
      .attribution({
        position: 'bottomright',
      })
      .addTo(this.map);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors',
    }).addTo(this.map);

    // Initialize marker cluster group
    this.markerClusterGroup = L.markerClusterGroup();
    this.map.addLayer(this.markerClusterGroup);

    // Add map filter controls
    this.addMapFilters();

    // Setup map event listeners
    this.map.on('click', () => {
      // Deselect car when clicking on the map (not on a marker)
      this.carDataService.selectCar(null);
    });

    // Initial load of markers
    this.updateMarkers(this.carDataService.getCars());
  }

  private addMapFilters(): void {
    // Create custom control for filtering car statuses
    const filterControl = new L.Control({ position: 'topright' });

    filterControl.onAdd = () => {
      const div = L.DomUtil.create('div', 'map-filter-control');
      div.innerHTML = `
        <div class="filter-header">Filter Cars</div>
        <div class="filter-options">
          <label><input type="checkbox" checked data-status="available"> Available</label>
          <label><input type="checkbox" checked data-status="rented"> Rented</label>
          <label><input type="checkbox" checked data-status="maintenance"> Maintenance</label>
          <label><input type="checkbox" checked data-status="inactive"> Inactive</label>
        </div>
      `;

      // Prevent map clicks from propagating through the control
      L.DomEvent.disableClickPropagation(div);
      L.DomEvent.disableScrollPropagation(div);

      // Add event listeners to checkboxes
      const checkboxes = div.querySelectorAll('input[type="checkbox"]');
      checkboxes.forEach(checkbox => {
        checkbox.addEventListener('change', e => {
          const target = e.target as HTMLInputElement;
          // eslint-disable-next-line dot-notation
          const status = target.dataset['status'] as CarStatus;
          this.mapService.toggleStatusVisibility(status);
          this.updateMarkerVisibility();
        });
      });

      return div;
    };

    filterControl.addTo(this.map);
  }

  private updateMarkerVisibility(): void {
    const visibleStatuses = this.mapService.visibleStatuses();

    this.markers.forEach((marker, id) => {
      const car = this.carDataService.getCar(id);
      if (car && visibleStatuses.includes(car.status)) {
        if (!this.markerClusterGroup.hasLayer(marker)) {
          this.markerClusterGroup.addLayer(marker);
        }
      } else {
        this.markerClusterGroup.removeLayer(marker);
      }
    });
  }

  private updateMarkers(cars: Car[]): void {
    // Clear existing markers
    this.markerClusterGroup.clearLayers();

    // Update existing markers and add new ones
    cars.forEach(car => {
      this.addOrUpdateMarker(car);
    });

    // Remove markers for cars that no longer exist
    const carIds = new Set(cars.map(car => car.id));
    this.markers.forEach((marker, id) => {
      if (!carIds.has(id)) {
        this.markerClusterGroup.removeLayer(marker);
        this.markers.delete(id);
      }
    });

    // Fit map bounds to show all markers if we have cars
    if (cars.length > 0) {
      const bounds = this.mapService.calculateBounds(cars);
      if (bounds) {
        this.map.fitBounds(bounds, { padding: [50, 50] });
      }
    }
  }

  private addOrUpdateMarker(car: Car): void {
    const position = L.latLng(car.latitude, car.longitude);

    if (this.markers.has(car.id)) {
      // Update existing marker
      const marker = this.markers.get(car.id)!;
      marker.setLatLng(position);
      marker.setPopupContent(this.mapService.createPopupContent(car));

      // Update icon in case status changed
      const icon = this.mapService.getMarkerIcon(car.status);
      marker.setIcon(icon);
    } else {
      // Create new marker with custom icon based on status
      const icon = this.mapService.getMarkerIcon(car.status);
      const marker = L.marker(position, { icon }).bindPopup(
        this.mapService.createPopupContent(car)
      );

      // Add click event to select car
      marker.on('click', () => {
        this.carDataService.selectCar(car.id);
      });

      // Add popup events
      marker.on('popupopen', () => {
        const trackButton = document.querySelector('.track-button');
        if (trackButton) {
          trackButton.addEventListener('click', e => {
            e.stopPropagation();
            // Open registration panel for this car
            this.carDataService.selectCar(car.id);
          });
        }
      });

      this.markers.set(car.id, marker);
    }

    // Add marker to cluster group if status is visible
    if (this.mapService.isStatusVisible(car.status)) {
      this.markerClusterGroup.addLayer(this.markers.get(car.id)!);
    }

    // Highlight marker if it's the selected car
    if (this.selectedCarId() === car.id) {
      this.highlightSelectedCar(car.id);
    }
  }

  private highlightSelectedCar(carId: string): void {
    // Clear any existing highlights
    this.clearHighlightedCars();

    // Highlight the selected car marker
    const marker = this.markers.get(carId);
    if (marker) {
      const element = marker.getElement();
      if (element) {
        element.classList.add('selected-marker');
      }

      // Open popup for the selected car
      marker.openPopup();

      // Center map on the selected car
      this.map.setView(marker.getLatLng(), this.map.getZoom());
    }
  }

  private clearHighlightedCars(): void {
    this.markers.forEach(marker => {
      const element = marker.getElement();
      if (element) {
        element.classList.remove('selected-marker');
      }
    });
  }

  @HostListener('window:resize')
  onResize(): void {
    // Update map size when window resizes
    if (this.map) {
      this.map.invalidateSize();
    }
  }
}
