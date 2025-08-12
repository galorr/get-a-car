import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { of, throwError } from 'rxjs';

import { CarDataService } from './car-data.service';
import { ApiService } from './api.service';
import { HttpClient } from '@angular/common/http';
import { Car, CarStatus, CarType } from '../models/car.model';
import { MOCK_CARS, MockApiResponses } from '../../test/mock-data-loader';
import { environment } from '../../environments/environment';

describe('CarDataService', () => {
  let service: CarDataService;
  let httpClientSpy: any;
  let apiServiceSpy: any;

  const mockCars: Car[] = MOCK_CARS;

  beforeEach(() => {
    httpClientSpy = {
      get: jest.fn(),
      post: jest.fn(),
      put: jest.fn(),
      delete: jest.fn(),
      patch: jest.fn()
    };

    apiServiceSpy = {
      get: jest.fn(),
      post: jest.fn(),
      put: jest.fn(),
      delete: jest.fn(),
      patch: jest.fn()
    };

    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        CarDataService,
        { provide: HttpClient, useValue: httpClientSpy },
        { provide: ApiService, useValue: apiServiceSpy }
      ]
    });

    service = TestBed.inject(CarDataService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('loadCars', () => {
    it('should load cars from mock data in development mode', (done) => {
      // Ensure mockDataEnabled is true
      // Mock environment property
      Object.defineProperty(environment, 'mockDataEnabled', {
        get: () => true
      });

      // Setup the mock response
      httpClientSpy.get.mockReturnValue(of(mockCars));

      // Call the method
      service.loadCars().subscribe({
        next: (cars) => {
          // Verify the result
          expect(cars).toEqual(mockCars);
          expect(service.getCars()).toEqual(mockCars);
          expect(httpClientSpy.get).toHaveBeenCalledWith('assets/mock-data/cars.json');
          done();
        },
        error: done.fail
      });
    });

    it('should load cars from API in production mode', (done) => {
      // Ensure mockDataEnabled is false
      // Mock environment property
      Object.defineProperty(environment, 'mockDataEnabled', {
        get: () => false
      });

      // Setup the mock response
      const apiResponse = MockApiResponses.getCarsResponse();
      apiServiceSpy.get.mockReturnValue(of(apiResponse));

      // Call the method
      service.loadCars().subscribe({
        next: (cars) => {
          // Verify the result
          expect(cars.length).toEqual(apiResponse.data.data.length);
          expect(service.getCars().length).toEqual(apiResponse.data.data.length);
          expect(apiServiceSpy.get).toHaveBeenCalled();
          done();
        },
        error: done.fail
      });
    });

    it('should handle errors when loading cars', (done) => {
      // Ensure mockDataEnabled is true for simplicity
      // Mock environment property
      Object.defineProperty(environment, 'mockDataEnabled', {
        get: () => true
      });

      // Setup the mock error
      const errorMessage = 'Error loading cars';
      httpClientSpy.get.mockReturnValue(throwError(() => new Error(errorMessage)));

      // Call the method
      service.loadCars().subscribe({
        next: () => done.fail('Expected an error, not success'),
        error: (error) => {
          // Verify the error handling
          expect(error.message).toBe(errorMessage);
          expect(service.error()).toBe('Failed to load cars. Please try again later.');
          expect(service.isLoading()).toBe(false);
          done();
        }
      });
    });
  });

  describe('getCar', () => {
    it('should return a car by ID', () => {
      // Setup the service with mock data
      service.updateCars(mockCars);

      // Get a car by ID
      const car = service.getCar('car-001');

      // Verify the result
      expect(car).toBeDefined();
      expect(car?.id).toBe('car-001');
      expect(car?.name).toBe('Toyota Corolla');
    });

    it('should return undefined for non-existent car ID', () => {
      // Setup the service with mock data
      service.updateCars(mockCars);

      // Get a non-existent car
      const car = service.getCar('non-existent-id');

      // Verify the result
      expect(car).toBeUndefined();
    });
  });

  describe('getCarFromApi', () => {
    it('should get a car from mock data in development mode', (done) => {
      // Ensure mockDataEnabled is true
      // Mock environment property
      Object.defineProperty(environment, 'mockDataEnabled', {
        get: () => true
      });

      // Setup the service with mock data
      httpClientSpy.get.mockReturnValue(of(mockCars));

      // Get a car by ID
      service.getCarFromApi('car-001').subscribe({
        next: (car) => {
          // Verify the result
          expect(car).toBeDefined();
          expect(car.id).toBe('car-001');
          expect(car.name).toBe('Toyota Corolla');
          expect(httpClientSpy.get).toHaveBeenCalledWith('assets/mock-data/cars.json');
          done();
        },
        error: done.fail
      });
    });

    it('should get a car from API in production mode', (done) => {
      // Ensure mockDataEnabled is false
      // Mock environment property
      Object.defineProperty(environment, 'mockDataEnabled', {
        get: () => false
      });

      // Setup the mock response
      const apiResponse = MockApiResponses.getCarByIdResponse('car-001');
      apiServiceSpy.get.mockReturnValue(of(apiResponse));

      // Get a car by ID
      service.getCarFromApi('car-001').subscribe({
        next: (car) => {
          // Verify the result
          expect(car).toBeDefined();
          expect(car.id).toBe('car-001');
          expect(apiServiceSpy.get).toHaveBeenCalled();
          done();
        },
        error: done.fail
      });
    });

    it('should handle errors when getting a car', (done) => {
      // Ensure mockDataEnabled is true for simplicity
      // Mock environment property
      Object.defineProperty(environment, 'mockDataEnabled', {
        get: () => true
      });

      // Setup the mock error
      const errorMessage = 'Error getting car';
      httpClientSpy.get.mockReturnValue(throwError(() => new Error(errorMessage)));

      // Get a car by ID
      service.getCarFromApi('car-001').subscribe({
        next: () => done.fail('Expected an error, not success'),
        error: (error) => {
          // Verify the error handling
          expect(error.message).toBe(errorMessage);
          expect(service.error()).toContain('Failed to load car');
          expect(service.isLoading()).toBe(false);
          done();
        }
      });
    });
  });

  describe('selectCar', () => {
    it('should select a car by ID', () => {
      // Setup the service with mock data
      service.updateCars(mockCars);

      // Select a car
      service.selectCar('car-001');

      // Verify the result
      expect(service.selectedCar()).toBeDefined();
      expect(service.selectedCar()?.id).toBe('car-001');
    });

    it('should deselect a car when passing null', () => {
      // Setup the service with mock data and select a car
      service.updateCars(mockCars);
      service.selectCar('car-001');

      // Deselect the car
      service.selectCar(null);

      // Verify the result
      expect(service.selectedCar()).toBeNull();
    });
  });

  describe('filtering', () => {
    beforeEach(() => {
      // Setup the service with mock data
      service.updateCars(mockCars);
    });

    it('should filter cars by status', () => {
      // Get available cars
      const availableCars = service.availableCars();

      // Verify the result
      expect(availableCars.length).toBe(mockCars.filter(car => car.status === CarStatus.AVAILABLE).length);
      expect(availableCars.every(car => car.status === CarStatus.AVAILABLE)).toBe(true);
    });

    it('should filter cars by type', () => {
      // Get cars by type
      const sedanCars = service.getCarsByType(CarType.SEDAN);

      // Verify the result
      expect(sedanCars.length).toBe(mockCars.filter(car => car.type === CarType.SEDAN).length);
      expect(sedanCars.every(car => car.type === CarType.SEDAN)).toBe(true);
    });

    it('should search cars by term', () => {
      // Search for cars
      const searchResults = service.searchCars('Toyota');

      // Verify the result
      expect(searchResults.length).toBe(mockCars.filter(car =>
        car.name.includes('Toyota') ||
        car.id.includes('Toyota') ||
        (car.licensePlate && car.licensePlate.includes('Toyota')) ||
        (car.model && car.model.includes('Toyota'))
      ).length);
      expect(searchResults.some(car => car.name.includes('Toyota') || car.model?.includes('Toyota'))).toBe(true);
    });

    it('should apply complex filters', () => {
      // Set a complex filter
      service.setFilter({
        status: [CarStatus.AVAILABLE],
        type: [CarType.SEDAN],
        year: { min: 2022 },
        sortBy: 'name',
        sortDirection: 'asc'
      });

      // Get filtered cars
      const filteredCars = service.filteredCars();

      // Verify the result
      expect(filteredCars.every(car => car.status === CarStatus.AVAILABLE)).toBe(true);
      expect(filteredCars.every(car => car.type === CarType.SEDAN)).toBe(true);
      expect(filteredCars.every(car => car.year !== undefined && car.year >= 2022)).toBe(true);

      // Verify sorting
      for (let i = 1; i < filteredCars.length; i++) {
        expect(filteredCars[i-1].name <= filteredCars[i].name).toBe(true);
      }
    });

    it('should update filter partially', () => {
      // Set initial filter
      service.setFilter({ status: [CarStatus.AVAILABLE] });

      // Update filter
      service.updateFilter({ type: [CarType.SEDAN] });

      // Verify the result
      const currentFilter = service.currentFilter();
      expect(currentFilter.status).toEqual([CarStatus.AVAILABLE]);
      expect(currentFilter.type).toEqual([CarType.SEDAN]);
    });

    it('should reset filter', () => {
      // Set a filter
      service.setFilter({
        status: [CarStatus.AVAILABLE],
        type: [CarType.SEDAN]
      });

      // Reset filter
      service.resetFilter();

      // Verify the result
      expect(service.currentFilter()).toEqual({});
    });
  });

  describe('CRUD operations', () => {
    it('should add a car', () => {
      // Setup the service with empty data
      service.updateCars([]);

      // Add a car
      const newCar = mockCars[0];
      service.addCar(newCar);

      // Verify the result
      expect(service.getCars().length).toBe(1);
      expect(service.getCars()[0]).toEqual(newCar);
    });

    it('should update a car', () => {
      // Setup the service with mock data
      service.updateCars(mockCars);

      // Update a car
      const updatedCar = { ...mockCars[0], name: 'Updated Car Name' };
      service.updateCar(updatedCar);

      // Verify the result
      expect(service.getCar(updatedCar.id)?.name).toBe('Updated Car Name');
    });

    it('should remove a car', () => {
      // Setup the service with mock data
      service.updateCars(mockCars);
      const initialCount = service.getCars().length;

      // Remove a car
      service.removeCar(mockCars[0].id);

      // Verify the result
      expect(service.getCars().length).toBe(initialCount - 1);
      expect(service.getCar(mockCars[0].id)).toBeUndefined();
    });

    it('should deselect a car when removing the selected car', () => {
      // Setup the service with mock data and select a car
      service.updateCars(mockCars);
      service.selectCar(mockCars[0].id);

      // Remove the selected car
      service.removeCar(mockCars[0].id);

      // Verify the result
      expect(service.selectedCar()).toBeNull();
    });
  });

  describe('API operations', () => {
    it('should create a car in the API', (done) => {
      // Ensure mockDataEnabled is false
      // Mock environment property
      Object.defineProperty(environment, 'mockDataEnabled', {
        get: () => false
      });

      // Setup the mock response
      const newCar = { ...mockCars[0], id: undefined } as any;
      const apiResponse = {
        data: { ...mockCars[0], id: 'new-car-id' },
        success: true,
        message: 'Car created successfully',
        timestamp: new Date().toISOString()
      };
      apiServiceSpy.post.mockReturnValue(of(apiResponse));

      // Create a car
      service.createCar(newCar).subscribe({
        next: (car) => {
          // Verify the result
          expect(car.id).toBe('new-car-id');
          expect(apiServiceSpy.post).toHaveBeenCalled();
          expect(service.getCar('new-car-id')).toBeDefined();
          done();
        },
        error: done.fail
      });
    });

    it('should update a car in the API', (done) => {
      // Ensure mockDataEnabled is false
      // Mock environment property
      Object.defineProperty(environment, 'mockDataEnabled', {
        get: () => false
      });

      // Setup the service with mock data
      service.updateCars(mockCars);

      // Setup the mock response
      const updatedCar = { ...mockCars[0], name: 'Updated Car Name' };
      const apiResponse = {
        data: updatedCar,
        success: true,
        message: 'Car updated successfully',
        timestamp: new Date().toISOString()
      };
      apiServiceSpy.put.mockReturnValue(of(apiResponse));

      // Update a car
      service.updateCarInApi(updatedCar).subscribe({
        next: (car) => {
          // Verify the result
          expect(car.name).toBe('Updated Car Name');
          expect(apiServiceSpy.put).toHaveBeenCalled();
          expect(service.getCar(updatedCar.id)?.name).toBe('Updated Car Name');
          done();
        },
        error: done.fail
      });
    });

    it('should delete a car in the API', (done) => {
      // Ensure mockDataEnabled is false
      // Mock environment property
      Object.defineProperty(environment, 'mockDataEnabled', {
        get: () => false
      });

      // Setup the service with mock data
      service.updateCars(mockCars);
      const initialCount = service.getCars().length;

      // Setup the mock response
      const apiResponse = {
        data: { id: mockCars[0].id },
        success: true,
        message: 'Car deleted successfully',
        timestamp: new Date().toISOString()
      };
      apiServiceSpy.delete.mockReturnValue(of(apiResponse));

      // Delete a car
      service.deleteCar(mockCars[0].id).subscribe({
        next: () => {
          // Verify the result
          expect(service.getCars().length).toBe(initialCount - 1);
          expect(service.getCar(mockCars[0].id)).toBeUndefined();
          expect(apiServiceSpy.delete).toHaveBeenCalled();
          done();
        },
        error: done.fail
      });
    });
  });

  describe('Car status and location updates', () => {
    beforeEach(() => {
      // Setup the service with mock data
      service.updateCars(mockCars);
    });

    it('should update car status', () => {
      // Update car status
      service.updateCarStatus(mockCars[0].id, CarStatus.RENTED);

      // Verify the result
      expect(service.getCar(mockCars[0].id)?.status).toBe(CarStatus.RENTED);
    });

    it('should update car location', () => {
      // Update car location
      const newLatitude = 52.0;
      const newLongitude = -1.0;
      service.updateCarLocation(mockCars[0].id, newLatitude, newLongitude);

      // Verify the result
      const updatedCar = service.getCar(mockCars[0].id);
      expect(updatedCar?.latitude).toBe(newLatitude);
      expect(updatedCar?.longitude).toBe(newLongitude);
    });

    it('should update car status in the API', (done) => {
      // Ensure mockDataEnabled is false
      // Mock environment property
      Object.defineProperty(environment, 'mockDataEnabled', {
        get: () => false
      });

      // Setup the mock response
      const updatedCar = { ...mockCars[0], status: CarStatus.RENTED };
      const apiResponse = {
        data: updatedCar,
        success: true,
        message: 'Car status updated successfully',
        timestamp: new Date().toISOString()
      };
      apiServiceSpy.patch.mockReturnValue(of(apiResponse));

      // Update car status
      service.updateCarStatusInApi(mockCars[0].id, CarStatus.RENTED).subscribe({
        next: (car) => {
          // Verify the result
          expect(car.status).toBe(CarStatus.RENTED);
          expect(apiServiceSpy.patch).toHaveBeenCalled();
          expect(service.getCar(mockCars[0].id)?.status).toBe(CarStatus.RENTED);
          done();
        },
        error: done.fail
      });
    });

    it('should update car location in the API', (done) => {
      // Ensure mockDataEnabled is false
      // Mock environment property
      Object.defineProperty(environment, 'mockDataEnabled', {
        get: () => false
      });

      // Setup the mock response
      const newLatitude = 52.0;
      const newLongitude = -1.0;
      const updatedCar = { ...mockCars[0], latitude: newLatitude, longitude: newLongitude };
      const apiResponse = {
        data: updatedCar,
        success: true,
        message: 'Car location updated successfully',
        timestamp: new Date().toISOString()
      };
      apiServiceSpy.patch.mockReturnValue(of(apiResponse));

      // Update car location
      service.updateCarLocationInApi(mockCars[0].id, newLatitude, newLongitude).subscribe({
        next: (car) => {
          // Verify the result
          expect(car.latitude).toBe(newLatitude);
          expect(car.longitude).toBe(newLongitude);
          expect(apiServiceSpy.patch).toHaveBeenCalled();
          const updatedCar = service.getCar(mockCars[0].id);
          expect(updatedCar?.latitude).toBe(newLatitude);
          expect(updatedCar?.longitude).toBe(newLongitude);
          done();
        },
        error: done.fail
      });
    });
  });

  describe('Error handling', () => {
    it('should clear error', () => {
      // Set an error
      // Access the private property using a different approach
      (service as any).errorSignal.set('Test error');

      // Clear error
      service.clearError();

      // Verify the result
      expect(service.error()).toBeNull();
    });
  });
});
