import { Injectable } from '@angular/core';
import * as L from 'leaflet';
import { Car, CarStatus } from '../models/car.model';

@Injectable({
  providedIn: 'root'
})
export class MapService {
  private defaultCenter: L.LatLngExpression = [51.505, -0.09];
  private defaultZoom = 13;

  // Custom marker icons based on car status
  private markerIcons: Record<CarStatus, L.Icon> = {
    [CarStatus.AVAILABLE]: this.createIcon('green'),
    [CarStatus.RENTED]: this.createIcon('blue'),
    [CarStatus.MAINTENANCE]: this.createIcon('orange'),
    [CarStatus.INACTIVE]: this.createIcon('gray')
  };

  constructor() { }

  /**
   * Initialize the map
   */
  initializeMap(elementId: string): L.Map {
    const map = L.map(elementId, {
      zoomControl: false, // Custom position for zoom control
      attributionControl: false // Custom position for attribution
    }).setView(this.defaultCenter, this.defaultZoom);

    // Add custom positioned controls
    L.control.zoom({
      position: 'topright'
    }).addTo(map);

    L.control.attribution({
      position: 'bottomright'
    }).addTo(map);

    // Add tile layer
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors'
    }).addTo(map);

    return map;
  }

  /**
   * Create a marker for a car
   */
  createCarMarker(car: Car, map: L.Map): L.Marker {
    const position = L.latLng(car.latitude, car.longitude);
    const icon = this.markerIcons[car.status];

    const marker = L.marker(position, { icon })
      .bindPopup(this.createPopupContent(car));

    return marker;
  }

  /**
   * Create popup content for a car marker
   */
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

  /**
   * Create a marker icon based on status color
   */
  private createIcon(color: string): L.Icon {
    return L.icon({
      iconUrl: `assets/images/marker-${color}.png`,
      iconSize: [25, 41],
      iconAnchor: [12, 41],
      popupAnchor: [1, -34]
    });
  }

  /**
   * Create a marker group for clustering
   * Note: In a real implementation, you would use Leaflet.markercluster plugin
   */
  createMarkerGroup(): L.LayerGroup {
    return L.layerGroup();
  }

  /**
   * Update a marker's position
   */
  updateMarkerPosition(marker: L.Marker, latitude: number, longitude: number): void {
    const position = L.latLng(latitude, longitude);
    marker.setLatLng(position);
  }

  /**
   * Update a marker's icon based on car status
   */
  updateMarkerIcon(marker: L.Marker, status: CarStatus): void {
    marker.setIcon(this.markerIcons[status]);
  }

  /**
   * Fit the map to show all markers
   */
  fitMapToMarkers(map: L.Map, markers: L.Marker[]): void {
    if (markers.length === 0) {
      map.setView(this.defaultCenter, this.defaultZoom);
      return;
    }

    const group = L.featureGroup(markers);
    map.fitBounds(group.getBounds(), {
      padding: [50, 50]
    });
  }

  /**
   * Create a filter control for the map
   */
  createFilterControl(): L.Control {
    const CustomControl = L.Control.extend({
      options: {
        position: 'topright'
      },

      onAdd: (map: L.Map) => {
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

        return div;
      }
    });

    return new CustomControl();
  }
}
