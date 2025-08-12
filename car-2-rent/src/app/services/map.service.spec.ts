import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';

import { MapService, MapMarker, MapBounds, ClusterOptions } from './map.service';
import { DataService } from './data.service';
import { Car, CarStatus } from '../models/car.model';
import { MOCK_CARS } from '../../test/mock-data-loader';
import * as L from 'leaflet';

describe('MapService', () => {
  let service: MapService;
  let dataServiceSpy: any;

  const mockCars: Car[] = MOCK_CARS;

  beforeEach(() => {
    // Create a spy for DataService
    const dataSpy = {
      cars: jest.fn().mockReturnValue(mockCars),
      selectedCar: jest.fn().mockReturnValue(null),
      selectedCarId: jest.fn().mockReturnValue(null),
      selectCar: jest.fn(),
      getAllCarLocations: jest.fn(),
      carLoadingSignal: { set: jest.fn() },
      carErrorSignal: { set: jest.fn() },
    };

    TestBed.configureTestingModule({
      providers: [MapService, { provide: DataService, useValue: dataSpy }],
    });

    service = TestBed.inject(MapService);
    dataServiceSpy = TestBed.inject(DataService);

    // Setup default spy return values
    dataServiceSpy.getAllCarLocations.mockReturnValue(
      of(
        mockCars.map(car => ({
          id: car.id,
          latitude: car.latitude,
          longitude: car.longitude,
          lastUpdated: car.lastUpdated,
        })),
      ),
    );
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('Map center and zoom', () => {
    it('should set map center', () => {
      const latitude = 52.0;
      const longitude = -1.0;

      service.setMapCenter(latitude, longitude);

      expect(service.mapCenter()).toEqual([latitude, longitude]);
    });

    it('should set map zoom', () => {
      const zoom = 15;

      service.setMapZoom(zoom);

      expect(service.mapZoom()).toBe(zoom);
    });
  });

  describe('Map bounds', () => {
    it('should set map bounds', () => {
      const bounds: MapBounds = {
        north: 52.0,
        south: 51.0,
        east: 0.0,
        west: -1.0,
      };

      service.setMapBounds(bounds);

      expect(service.mapBounds()).toEqual(bounds);
    });

    it('should clear map bounds', () => {
      const bounds: MapBounds = {
        north: 52.0,
        south: 51.0,
        east: 0.0,
        west: -1.0,
      };

      service.setMapBounds(bounds);
      service.clearMapBounds();

      expect(service.mapBounds()).toBeNull();
    });
  });

  describe('Status visibility', () => {
    it('should toggle status visibility', () => {
      // Initially all statuses are visible
      expect(service.isStatusVisible(CarStatus.AVAILABLE)).toBe(true);

      // Toggle AVAILABLE status off
      service.toggleStatusVisibility(CarStatus.AVAILABLE);

      // AVAILABLE should now be hidden
      expect(service.isStatusVisible(CarStatus.AVAILABLE)).toBe(false);

      // Toggle AVAILABLE status back on
      service.toggleStatusVisibility(CarStatus.AVAILABLE);

      // AVAILABLE should now be visible again
      expect(service.isStatusVisible(CarStatus.AVAILABLE)).toBe(true);
    });

    it('should set visible statuses', () => {
      const statuses = [CarStatus.AVAILABLE, CarStatus.RENTED];

      service.setVisibleStatuses(statuses);

      expect(service.visibleStatuses()).toEqual(statuses);
      expect(service.isStatusVisible(CarStatus.AVAILABLE)).toBe(true);
      expect(service.isStatusVisible(CarStatus.RENTED)).toBe(true);
      expect(service.isStatusVisible(CarStatus.MAINTENANCE)).toBe(false);
      expect(service.isStatusVisible(CarStatus.INACTIVE)).toBe(false);
    });
  });

  describe('Cluster options', () => {
    it('should update cluster options', () => {
      const options: Partial<ClusterOptions> = {
        enabled: false,
        maxClusterRadius: 100,
      };

      service.updateClusterOptions(options);

      expect(service.clusterOptions().enabled).toBe(false);
      expect(service.clusterOptions().maxClusterRadius).toBe(100);
      // The disableClusteringAtZoom should remain unchanged
      expect(service.clusterOptions().disableClusteringAtZoom).toBe(18);
    });
  });

  describe('Marker selection', () => {
    it('should select a marker', () => {
      service.selectMarker('car-001');

      expect(service.selectedMarkerId()).toBe('car-001');
      expect(dataServiceSpy.selectCar).toHaveBeenCalledWith('car-001');
    });

    it('should deselect a marker when passing null', () => {
      service.selectMarker('car-001');
      service.selectMarker(null);

      expect(service.selectedMarkerId()).toBeNull();
      expect(dataServiceSpy.selectCar).toHaveBeenCalledWith(null);
    });

    it('should not call dataService.selectCar if the car is already selected', () => {
      // Setup: Set the selected car ID
      dataServiceSpy.selectedCarId.mockReturnValue(mockCars[0].id);

      service.selectMarker(mockCars[0].id);

      expect(service.selectedMarkerId()).toBe(mockCars[0].id);
      // The selectCar method should not be called since the car is already selected
      expect(dataServiceSpy.selectCar).not.toHaveBeenCalled();
    });
  });

  describe('Marker icons and popups', () => {
    it('should get marker icon based on car status', () => {
      const icon = service.getMarkerIcon(CarStatus.AVAILABLE);

      expect(icon).toBeDefined();
      expect((icon as any).options.iconUrl).toBe('assets/images/marker-green.png');
    });

    it('should create popup content for a car', () => {
      const car = mockCars[0];
      const popupContent = service.createPopupContent(car);

      expect(popupContent).toContain(car.name);
      expect(popupContent).toContain(car.id);
      expect(popupContent).toContain(car.status);
      expect(popupContent).toContain('Track This Car');
    });
  });

  describe('Marker management', () => {
    it('should update markers from cars', () => {
      // Call the method to update markers
      service.updateMarkersFromCars(mockCars);

      // Check that markers were created
      expect(service.markers().size).toBe(mockCars.length);

      // Check that each car has a corresponding marker
      mockCars.forEach(car => {
        expect(service.markers().has(car.id)).toBe(true);
      });
    });

    it('should update existing markers when cars change', () => {
      // First, create markers
      service.updateMarkersFromCars(mockCars);

      // Then, update a car's position
      const updatedCars = [...mockCars];
      updatedCars[0] = { ...updatedCars[0], latitude: 52.0, longitude: -1.0 };

      // Update markers with the modified cars
      service.updateMarkersFromCars(updatedCars);

      // Check that the marker was updated
      const marker = service.markers().get(updatedCars[0].id);
      expect(marker).toBeDefined();
      expect(marker?.marker.getLatLng().lat).toBe(52.0);
      expect(marker?.marker.getLatLng().lng).toBe(-1.0);
    });

    it('should remove markers for cars that no longer exist', () => {
      // First, create markers
      service.updateMarkersFromCars(mockCars);

      // Then, remove a car
      const reducedCars = mockCars.slice(1); // Remove the first car

      // Update markers with the reduced set of cars
      service.updateMarkersFromCars(reducedCars);

      // Check that the marker for the removed car was deleted
      expect(service.markers().has(mockCars[0].id)).toBe(false);
      expect(service.markers().size).toBe(reducedCars.length);
    });
  });

  describe('Visible markers', () => {
    beforeEach(() => {
      // Create markers
      service.updateMarkersFromCars(mockCars);
    });

    it('should filter markers by visible statuses', () => {
      // Set visible statuses to only AVAILABLE
      service.setVisibleStatuses([CarStatus.AVAILABLE]);

      // Get visible markers
      const visibleMarkers = service.visibleMarkers();

      // Check that only AVAILABLE markers are visible
      expect(visibleMarkers.length).toBe(
        mockCars.filter(car => car.status === CarStatus.AVAILABLE).length,
      );
      expect(visibleMarkers.every(marker => marker.status === CarStatus.AVAILABLE)).toBe(true);
    });

    it('should count markers by status', () => {
      const counts = service.markersCountByStatus();

      // Check counts for each status
      expect(counts[CarStatus.AVAILABLE]).toBe(
        mockCars.filter(car => car.status === CarStatus.AVAILABLE).length,
      );
      expect(counts[CarStatus.RENTED]).toBe(
        mockCars.filter(car => car.status === CarStatus.RENTED).length,
      );
      expect(counts[CarStatus.MAINTENANCE]).toBe(
        mockCars.filter(car => car.status === CarStatus.MAINTENANCE).length,
      );
      expect(counts[CarStatus.INACTIVE]).toBe(
        mockCars.filter(car => car.status === CarStatus.INACTIVE).length,
      );
      expect(counts.total).toBe(mockCars.length);
    });
  });

  describe('Map operations', () => {
    beforeEach(() => {
      // Create markers
      service.updateMarkersFromCars(mockCars);
    });

    it('should fit map to markers', () => {
      const bounds = service.fitMapToMarkers();

      expect(bounds).toBeDefined();
      if (bounds) {
        expect(bounds.north).toBeGreaterThan(bounds.south);
        expect(bounds.east).toBeGreaterThan(bounds.west);
        expect(service.mapBounds()).toEqual(bounds);
      }
    });

    it('should fit map to a specific car', () => {
      const result = service.fitMapToCar(mockCars[0].id);

      expect(result).toBe(true);
      expect(service.mapCenter()).toEqual([mockCars[0].latitude, mockCars[0].longitude]);
      expect(service.mapZoom()).toBe(18);
      expect(service.selectedMarkerId()).toBe(mockCars[0].id);
    });

    it('should return false when fitting map to a non-existent car', () => {
      const result = service.fitMapToCar('non-existent-id');

      expect(result).toBe(false);
    });

    it('should get markers within bounds', () => {
      const bounds: MapBounds = {
        north: 51.52,
        south: 51.50,
        east: -0.08,
        west: -0.10,
      };

      const markersInBounds = service.getMarkersWithinBounds(bounds);

      // Count how many cars are within these bounds
      const expectedCount = mockCars.filter(
        car =>
          car.latitude <= bounds.north &&
          car.latitude >= bounds.south &&
          car.longitude <= bounds.east &&
          car.longitude >= bounds.west,
      ).length;

      expect(markersInBounds.length).toBe(expectedCount);
    });
  });

  describe('Car location refresh', () => {
    it('should refresh car locations from API', (done) => {
      service.refreshCarLocations().subscribe({
        next: (locations) => {
          expect(locations.length).toBe(mockCars.length);
          expect(dataServiceSpy.getAllCarLocations).toHaveBeenCalled();
          done();
        },
        error: done.fail,
      });
    });

    it('should handle errors when refreshing car locations', (done) => {
      const errorMessage = 'Error refreshing car locations';
      dataServiceSpy.getAllCarLocations.mockReturnValue(throwError(() => new Error(errorMessage)));

      service.refreshCarLocations().subscribe({
        next: () => done.fail('Expected an error, not success'),
        error: (error) => {
          expect(error.message).toBe(errorMessage);
          done();
        },
      });
    });
  });

  describe('Effects', () => {
    it('should update markers when car data changes', () => {
      // Spy on updateMarkersFromCars
      jest.spyOn(service, 'updateMarkersFromCars');

      // Trigger the effect by calling cars
      const carsValue = dataServiceSpy.cars();

      // Verify that updateMarkersFromCars was called with the cars
      expect(service.updateMarkersFromCars).toHaveBeenCalledWith(carsValue);
    });

    it('should select marker and set map center when selected car changes', () => {
      // Spy on selectMarker and setMapCenter
      jest.spyOn(service, 'selectMarker');
      jest.spyOn(service, 'setMapCenter');

      // Set a selected car
      const selectedCar = mockCars[0];
      dataServiceSpy.selectedCar.mockReturnValue(selectedCar);

      // Trigger the effect by calling selectedCar
      const selectedCarValue = dataServiceSpy.selectedCar();

      // Verify that selectMarker and setMapCenter were called
      expect(service.selectMarker).toHaveBeenCalledWith(selectedCar.id);
      expect(service.setMapCenter).toHaveBeenCalledWith(selectedCar.latitude, selectedCar.longitude);
    });

    it('should deselect marker when selected car is null', () => {
      // Spy on selectMarker
      jest.spyOn(service, 'selectMarker');

      // Set selected car to null
      dataServiceSpy.selectedCar.mockReturnValue(null);

      // Trigger the effect by calling selectedCar
      const selectedCarValue = dataServiceSpy.selectedCar();

      // Verify that selectMarker was called with null
      expect(service.selectMarker).toHaveBeenCalledWith(null);
    });
  });
});
