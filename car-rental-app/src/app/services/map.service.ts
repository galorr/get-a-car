import { Injectable, signal, computed } from '@angular/core';
import * as L from 'leaflet';
import { Car, CarStatus } from '../models/car.model';

// Define the map service interface
export interface MapServiceInterface {
  initializeMap(elementId: string): L.Map;
  createCarMarker(car: Car, map: L.Map): L.Marker;
  createMarkerGroup(): L.LayerGroup;
  updateMarkerPosition(marker: L.Marker, latitude: number, longitude: number): void;
  updateMarkerIcon(marker: L.Marker, status: CarStatus): void;
  fitMapToMarkers(map: L.Map, markers: L.Marker[]): void;
  createFilterControl(): L.Control;
  createPopupContent(car: Car): string;
}

// Create a factory function for the map service
export const mapServiceFactory = (): MapServiceInterface => {
  // Constants
  const defaultCenter: L.LatLngExpression = [51.505, -0.09];
  const defaultZoom = 13;

  // Create a marker icon based on status color
  const createIcon = (color: string): L.Icon => {
    return L.icon({
      iconUrl: `assets/images/marker-${color}.png`,
      iconSize: [25, 41],
      iconAnchor: [12, 41],
      popupAnchor: [1, -34]
    });
  };

  // Custom marker icons based on car status
  const markerIcons: Record<CarStatus, L.Icon> = {
    [CarStatus.AVAILABLE]: createIcon('green'),
    [CarStatus.RENTED]: createIcon('red'),
    [CarStatus.MAINTENANCE]: createIcon('orange'),
    [CarStatus.INACTIVE]: createIcon('gray')
  };

  // Create popup content for a car marker
  const createPopupContent = (car: Car): string => {
    return `
      <div class="car-popup">
        <h3>${car.name}</h3>
        <p><strong>ID:</strong> ${car.id}</p>
        <p><strong>Status:</strong> ${car.status}</p>
        <p><strong>Last Updated:</strong> ${new Date(car.lastUpdated).toLocaleString()}</p>
        <button class="track-button" data-car-id="${car.id}">Track This Car</button>
      </div>
    `;
  };

  // Initialize the map
  const initializeMap = (elementId: string): L.Map => {
    const map = L.map(elementId, {
      zoomControl: false, // Custom position for zoom control
      attributionControl: false // Custom position for attribution
    }).setView(defaultCenter, defaultZoom);

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
  };

  // Create a marker for a car
  const createCarMarker = (car: Car, map: L.Map): L.Marker => {
    const position = L.latLng(car.latitude, car.longitude);
    const icon = markerIcons[car.status];

    const marker = L.marker(position, { icon })
      .bindPopup(createPopupContent(car));

    return marker;
  };

  // Create a marker group for clustering
  const createMarkerGroup = (): L.LayerGroup => {
    return L.layerGroup();
  };

  // Update a marker's position
  const updateMarkerPosition = (marker: L.Marker, latitude: number, longitude: number): void => {
    const position = L.latLng(latitude, longitude);
    marker.setLatLng(position);
  };

  // Update a marker's icon based on car status
  const updateMarkerIcon = (marker: L.Marker, status: CarStatus): void => {
    marker.setIcon(markerIcons[status]);
  };

  // Fit the map to show all markers
  const fitMapToMarkers = (map: L.Map, markers: L.Marker[]): void => {
    if (markers.length === 0) {
      map.setView(defaultCenter, defaultZoom);
      return;
    }

    const group = L.featureGroup(markers);
    map.fitBounds(group.getBounds(), {
      padding: [50, 50]
    });
  };

  // Create a filter control for the map
  const createFilterControl = (): L.Control => {
    const CustomControl = L.Control.extend({
      options: {
        position: 'topleft'
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
  };

  // Return the service implementation
  return {
    initializeMap,
    createCarMarker,
    createMarkerGroup,
    updateMarkerPosition,
    updateMarkerIcon,
    fitMapToMarkers,
    createFilterControl,
    createPopupContent
  };
};

// Provide the map service using the functional provider pattern
@Injectable({
  providedIn: 'root',
  useFactory: mapServiceFactory
})
export class MapService implements MapServiceInterface {
  private service = mapServiceFactory();

  initializeMap(elementId: string): L.Map {
    return this.service.initializeMap(elementId);
  }

  createCarMarker(car: Car, map: L.Map): L.Marker {
    return this.service.createCarMarker(car, map);
  }

  createMarkerGroup(): L.LayerGroup {
    return this.service.createMarkerGroup();
  }

  updateMarkerPosition(marker: L.Marker, latitude: number, longitude: number): void {
    this.service.updateMarkerPosition(marker, latitude, longitude);
  }

  updateMarkerIcon(marker: L.Marker, status: CarStatus): void {
    this.service.updateMarkerIcon(marker, status);
  }

  fitMapToMarkers(map: L.Map, markers: L.Marker[]): void {
    this.service.fitMapToMarkers(map, markers);
  }

  createFilterControl(): L.Control {
    return this.service.createFilterControl();
  }

  createPopupContent(car: Car): string {
    return this.service.createPopupContent(car);
  }
}
