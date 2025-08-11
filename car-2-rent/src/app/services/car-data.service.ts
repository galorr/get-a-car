import { Injectable, signal, computed, effect, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, throwError, catchError, map, tap, finalize } from 'rxjs';
import { Car, CarStatus, CarType, CarFilter, CarResponse, CarRequest, mapCarResponseToCar, mapCarToCarRequest, CarLocationUpdateRequest, CarStatusUpdateRequest } from '../models/car.model';
import { ApiService } from './api.service';
import { API_ENDPOINTS, GetCarsResponse, GetCarResponse, CreateCarResponse, UpdateCarResponse, DeleteCarResponse, UpdateCarLocationResponse, UpdateCarStatusResponse, GetAllCarLocationsResponse } from '../models/api.model';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class CarDataService {
  // Signal for the collection of cars
  private carsSignal = signal<Car[]>([]);
  
  // Signal for loading state
  private loadingSignal = signal<boolean>(false);
  
  // Signal for error state
  private errorSignal = signal<string | null>(null);
  
  // Signal for current filter
  private filterSignal = signal<CarFilter>({});
  
  // Computed signals for filtered cars
  public availableCars = computed(() => 
    this.carsSignal().filter(car => car.status === CarStatus.AVAILABLE)
  );
  
  public rentedCars = computed(() => 
    this.carsSignal().filter(car => car.status === CarStatus.RENTED)
  );
  
  public maintenanceCars = computed(() => 
    this.carsSignal().filter(car => car.status === CarStatus.MAINTENANCE)
  );
  
  public inactiveCars = computed(() => 
    this.carsSignal().filter(car => car.status === CarStatus.INACTIVE)
  );
  
  // Signal for selected car
  private selectedCarIdSignal = signal<string | null>(null);
  
  // Computed signal for the selected car
  public selectedCar = computed(() => {
    const selectedId = this.selectedCarIdSignal();
    return selectedId ? this.carsSignal().find(car => car.id === selectedId) || null : null;
  });
  
  // Computed signal for filtered cars
  public filteredCars = computed(() => {
    const filter = this.filterSignal();
    let cars = this.carsSignal();
    
    // Apply status filter
    if (filter.status && filter.status.length > 0) {
      cars = cars.filter(car => filter.status!.includes(car.status));
    }
    
    // Apply type filter
    if (filter.type && filter.type.length > 0) {
      cars = cars.filter(car => car.type && filter.type!.includes(car.type));
    }
    
    // Apply year filter
    if (filter.year) {
      if (filter.year.min !== undefined) {
        cars = cars.filter(car => car.year !== undefined && car.year >= filter.year!.min!);
      }
      if (filter.year.max !== undefined) {
        cars = cars.filter(car => car.year !== undefined && car.year <= filter.year!.max!);
      }
    }
    
    // Apply rental rate filter
    if (filter.rentalRate) {
      if (filter.rentalRate.min !== undefined) {
        cars = cars.filter(car => car.rentalRate !== undefined && car.rentalRate >= filter.rentalRate!.min!);
      }
      if (filter.rentalRate.max !== undefined) {
        cars = cars.filter(car => car.rentalRate !== undefined && car.rentalRate <= filter.rentalRate!.max!);
      }
    }
    
    // Apply search term filter
    if (filter.searchTerm) {
      const term = filter.searchTerm.toLowerCase();
      cars = cars.filter(car => 
        car.name.toLowerCase().includes(term) || 
        car.id.toLowerCase().includes(term) || 
        (car.licensePlate && car.licensePlate.toLowerCase().includes(term)) ||
        (car.model && car.model.toLowerCase().includes(term))
      );
    }
    
    // Apply sorting
    if (filter.sortBy) {
      cars = [...cars].sort((a, b) => {
        const aValue = a[filter.sortBy!];
        const bValue = b[filter.sortBy!];
        
        // Handle undefined values
        if (aValue === undefined && bValue === undefined) return 0;
        if (aValue === undefined) return 1;
        if (bValue === undefined) return -1;
        
        // Compare values
        if (aValue < bValue) return filter.sortDirection === 'desc' ? 1 : -1;
        if (aValue > bValue) return filter.sortDirection === 'desc' ? -1 : 1;
        return 0;
      });
    }
    
    return cars;
  });
  
  // Computed signal for loading state
  public isLoading = computed(() => this.loadingSignal());
  
  // Computed signal for error state
  public error = computed(() => this.errorSignal());
  
  // Computed signal for current filter
  public currentFilter = computed(() => this.filterSignal());
  
  private apiService = inject(ApiService);
  private http = inject(HttpClient);
  
  constructor() {
    // Load initial data
    this.loadCars();
    
    // Setup effect for logging car selection changes
    effect(() => {
      const selected = this.selectedCar();
      if (selected) {
        console.log(`Selected car: ${selected.name} (${selected.id})`);
      }
    });
  }
  
  /**
   * Load cars from API or mock data
   */
  loadCars(): Observable<Car[]> {
    this.loadingSignal.set(true);
    this.errorSignal.set(null);
    
    // Use mock data in development mode
    if (environment.mockDataEnabled) {
      return this.http.get<Car[]>('assets/mock-data/cars.json').pipe(
        tap(cars => this.carsSignal.set(cars)),
        catchError(error => {
          console.error('Error loading cars:', error);
          this.errorSignal.set('Failed to load cars. Please try again later.');
          return throwError(() => error);
        }),
        finalize(() => this.loadingSignal.set(false))
      );
    }
    
    // Use real API in production mode
    return this.apiService.get<GetCarsResponse>(API_ENDPOINTS.CARS, { useCache: true }).pipe(
      map(response => response.data.map(carResponse => mapCarResponseToCar(carResponse))),
      tap(cars => this.carsSignal.set(cars)),
      catchError(error => {
        console.error('Error loading cars:', error);
        this.errorSignal.set('Failed to load cars. Please try again later.');
        return throwError(() => error);
      }),
      finalize(() => this.loadingSignal.set(false))
    );
  }
  
  /**
   * Get all cars
   */
  getCars(): Car[] {
    return this.carsSignal();
  }
  
  /**
   * Get a specific car by ID
   */
  getCar(id: string): Car | undefined {
    return this.carsSignal().find(car => car.id === id);
  }
  
  /**
   * Get a specific car by ID from API
   */
  getCarFromApi(id: string): Observable<Car> {
    this.loadingSignal.set(true);
    this.errorSignal.set(null);
    
    // Use mock data in development mode
    if (environment.mockDataEnabled) {
      return this.http.get<Car[]>('assets/mock-data/cars.json').pipe(
        map(cars => {
          const car = cars.find(c => c.id === id);
          if (!car) {
            throw new Error(`Car with ID ${id} not found`);
          }
          return car;
        }),
        tap(car => {
          // Update the car in the signal if it exists
          this.updateCar(car);
          // Select the car
          this.selectCar(car.id);
        }),
        catchError(error => {
          console.error(`Error loading car ${id}:`, error);
          this.errorSignal.set(`Failed to load car ${id}. Please try again later.`);
          return throwError(() => error);
        }),
        finalize(() => this.loadingSignal.set(false))
      );
    }
    
    // Use real API in production mode
    return this.apiService.get<GetCarResponse>(API_ENDPOINTS.CAR_BY_ID(id), { useCache: true }).pipe(
      map(response => mapCarResponseToCar(response.data)),
      tap(car => {
        // Update the car in the signal if it exists
        this.updateCar(car);
        // Select the car
        this.selectCar(car.id);
      }),
      catchError(error => {
        console.error(`Error loading car ${id}:`, error);
        this.errorSignal.set(`Failed to load car ${id}. Please try again later.`);
        return throwError(() => error);
      }),
      finalize(() => this.loadingSignal.set(false))
    );
  }
  
  /**
   * Select a car
   */
  selectCar(id: string | null): void {
    this.selectedCarIdSignal.set(id);
  }
  
  /**
   * Set filter for cars
   */
  setFilter(filter: CarFilter): void {
    this.filterSignal.set(filter);
  }
  
  /**
   * Update filter for cars
   */
  updateFilter(filter: Partial<CarFilter>): void {
    this.filterSignal.update(currentFilter => ({
      ...currentFilter,
      ...filter
    }));
  }
  
  /**
   * Reset filter for cars
   */
  resetFilter(): void {
    this.filterSignal.set({});
  }
  
  /**
   * Update cars
   */
  updateCars(cars: Car[]): void {
    this.carsSignal.set(cars);
  }
  
  /**
   * Update a single car
   */
  updateCar(updatedCar: Car): void {
    this.carsSignal.update(cars => 
      cars.map(car => car.id === updatedCar.id ? updatedCar : car)
    );
  }
  
  /**
   * Add a new car
   */
  addCar(newCar: Car): void {
    this.carsSignal.update(cars => [...cars, newCar]);
  }
  
  /**
   * Create a new car in the API
   */
  createCar(car: Car): Observable<Car> {
    this.loadingSignal.set(true);
    this.errorSignal.set(null);
    
    // Use mock data in development mode
    if (environment.mockDataEnabled) {
      // Simulate API call
      return of({
        ...car,
        id: `car-${Date.now()}`, // Generate a unique ID
        lastUpdated: new Date()
      }).pipe(
        tap(newCar => this.addCar(newCar)),
        catchError(error => {
          console.error('Error creating car:', error);
          this.errorSignal.set('Failed to create car. Please try again later.');
          return throwError(() => error);
        }),
        finalize(() => this.loadingSignal.set(false))
      );
    }
    
    // Use real API in production mode
    const carRequest = mapCarToCarRequest(car);
    
    return this.apiService.post<CreateCarResponse>(API_ENDPOINTS.CARS, carRequest, {
      invalidateCache: true,
      cachePattern: API_ENDPOINTS.CARS
    }).pipe(
      map(response => mapCarResponseToCar(response.data)),
      tap(newCar => this.addCar(newCar)),
      catchError(error => {
        console.error('Error creating car:', error);
        this.errorSignal.set('Failed to create car. Please try again later.');
        return throwError(() => error);
      }),
      finalize(() => this.loadingSignal.set(false))
    );
  }
  
  /**
   * Update a car in the API
   */
  updateCarInApi(car: Car): Observable<Car> {
    this.loadingSignal.set(true);
    this.errorSignal.set(null);
    
    // Use mock data in development mode
    if (environment.mockDataEnabled) {
      // Simulate API call
      return of({
        ...car,
        lastUpdated: new Date()
      }).pipe(
        tap(updatedCar => this.updateCar(updatedCar)),
        catchError(error => {
          console.error(`Error updating car ${car.id}:`, error);
          this.errorSignal.set(`Failed to update car ${car.id}. Please try again later.`);
          return throwError(() => error);
        }),
        finalize(() => this.loadingSignal.set(false))
      );
    }
    
    // Use real API in production mode
    const carRequest = mapCarToCarRequest(car);
    
    return this.apiService.put<UpdateCarResponse>(API_ENDPOINTS.CAR_BY_ID(car.id), carRequest, {
      invalidateCache: true,
      cachePattern: API_ENDPOINTS.CARS
    }).pipe(
      map(response => mapCarResponseToCar(response.data)),
      tap(updatedCar => this.updateCar(updatedCar)),
      catchError(error => {
        console.error(`Error updating car ${car.id}:`, error);
        this.errorSignal.set(`Failed to update car ${car.id}. Please try again later.`);
        return throwError(() => error);
      }),
      finalize(() => this.loadingSignal.set(false))
    );
  }
  
  /**
   * Remove a car
   */
  removeCar(id: string): void {
    this.carsSignal.update(cars => cars.filter(car => car.id !== id));
    
    // If the removed car was selected, deselect it
    if (this.selectedCarIdSignal() === id) {
      this.selectCar(null);
    }
  }
  
  /**
   * Delete a car from the API
   */
  deleteCar(id: string): Observable<void> {
    this.loadingSignal.set(true);
    this.errorSignal.set(null);
    
    // Use mock data in development mode
    if (environment.mockDataEnabled) {
      // Simulate API call
      return of(undefined).pipe(
        tap(() => this.removeCar(id)),
        catchError(error => {
          console.error(`Error deleting car ${id}:`, error);
          this.errorSignal.set(`Failed to delete car ${id}. Please try again later.`);
          return throwError(() => error);
        }),
        finalize(() => this.loadingSignal.set(false))
      );
    }
    
    // Use real API in production mode
    return this.apiService.delete<DeleteCarResponse>(API_ENDPOINTS.CAR_BY_ID(id), {
      invalidateCache: true,
      cachePattern: API_ENDPOINTS.CARS
    }).pipe(
      map(() => undefined),
      tap(() => this.removeCar(id)),
      catchError(error => {
        console.error(`Error deleting car ${id}:`, error);
        this.errorSignal.set(`Failed to delete car ${id}. Please try again later.`);
        return throwError(() => error);
      }),
      finalize(() => this.loadingSignal.set(false))
    );
  }
  
  /**
   * Update a car's status
   */
  updateCarStatus(id: string, status: CarStatus): void {
    this.carsSignal.update(cars => 
      cars.map(car => {
        if (car.id === id) {
          return { ...car, status, lastUpdated: new Date() };
        }
        return car;
      })
    );
  }
  
  /**
   * Update a car's status in the API
   */
  updateCarStatusInApi(id: string, status: CarStatus): Observable<Car> {
    this.loadingSignal.set(true);
    this.errorSignal.set(null);
    
    // Use mock data in development mode
    if (environment.mockDataEnabled) {
      // Simulate API call
      const car = this.getCar(id);
      if (!car) {
        return throwError(() => new Error(`Car with ID ${id} not found`));
      }
      
      const updatedCar = {
        ...car,
        status,
        lastUpdated: new Date()
      };
      
      return of(updatedCar).pipe(
        tap(car => this.updateCar(car)),
        catchError(error => {
          console.error(`Error updating car status ${id}:`, error);
          this.errorSignal.set(`Failed to update car status ${id}. Please try again later.`);
          return throwError(() => error);
        }),
        finalize(() => this.loadingSignal.set(false))
      );
    }
    
    // Use real API in production mode
    const statusRequest: CarStatusUpdateRequest = {
      status
    };
    
    return this.apiService.patch<UpdateCarStatusResponse>(API_ENDPOINTS.CAR_STATUS(id), statusRequest, {
      invalidateCache: true,
      cachePattern: API_ENDPOINTS.CARS
    }).pipe(
      map(response => mapCarResponseToCar(response.data)),
      tap(updatedCar => this.updateCar(updatedCar)),
      catchError(error => {
        console.error(`Error updating car status ${id}:`, error);
        this.errorSignal.set(`Failed to update car status ${id}. Please try again later.`);
        return throwError(() => error);
      }),
      finalize(() => this.loadingSignal.set(false))
    );
  }
  
  /**
   * Update a car's location
   */
  updateCarLocation(id: string, latitude: number, longitude: number): void {
    this.carsSignal.update(cars => 
      cars.map(car => {
        if (car.id === id) {
          return { ...car, latitude, longitude, lastUpdated: new Date() };
        }
        return car;
      })
    );
  }
  
  /**
   * Update a car's location in the API
   */
  updateCarLocationInApi(id: string, latitude: number, longitude: number): Observable<Car> {
    this.loadingSignal.set(true);
    this.errorSignal.set(null);
    
    // Use mock data in development mode
    if (environment.mockDataEnabled) {
      // Simulate API call
      const car = this.getCar(id);
      if (!car) {
        return throwError(() => new Error(`Car with ID ${id} not found`));
      }
      
      const updatedCar = {
        ...car,
        latitude,
        longitude,
        lastUpdated: new Date()
      };
      
      return of(updatedCar).pipe(
        tap(car => this.updateCar(car)),
        catchError(error => {
          console.error(`Error updating car location ${id}:`, error);
          this.errorSignal.set(`Failed to update car location ${id}. Please try again later.`);
          return throwError(() => error);
        }),
        finalize(() => this.loadingSignal.set(false))
      );
    }
    
    // Use real API in production mode
    const locationRequest: CarLocationUpdateRequest = {
      latitude,
      longitude
    };
    
    return this.apiService.patch<UpdateCarLocationResponse>(API_ENDPOINTS.CAR_LOCATION(id), locationRequest, {
      invalidateCache: true,
      cachePattern: API_ENDPOINTS.CARS
    }).pipe(
      map(response => mapCarResponseToCar(response.data)),
      tap(updatedCar => this.updateCar(updatedCar)),
      catchError(error => {
        console.error(`Error updating car location ${id}:`, error);
        this.errorSignal.set(`Failed to update car location ${id}. Please try again later.`);
        return throwError(() => error);
      }),
      finalize(() => this.loadingSignal.set(false))
    );
  }
  
  /**
   * Get all car locations
   */
  getAllCarLocations(): Observable<{ id: string; latitude: number; longitude: number; lastUpdated: Date }[]> {
    this.loadingSignal.set(true);
    this.errorSignal.set(null);
    
    // Use mock data in development mode
    if (environment.mockDataEnabled) {
      // Use existing cars data
      return of(this.carsSignal().map(car => ({
        id: car.id,
        latitude: car.latitude,
        longitude: car.longitude,
        lastUpdated: car.lastUpdated
      }))).pipe(
        catchError(error => {
          console.error('Error getting car locations:', error);
          this.errorSignal.set('Failed to get car locations. Please try again later.');
          return throwError(() => error);
        }),
        finalize(() => this.loadingSignal.set(false))
      );
    }
    
    // Use real API in production mode
    return this.apiService.get<GetAllCarLocationsResponse>(API_ENDPOINTS.CAR_LOCATIONS, { useCache: true }).pipe(
      map(response => response.data.locations.map(location => ({
        id: location.id,
        latitude: location.latitude,
        longitude: location.longitude,
        lastUpdated: new Date(location.lastUpdated)
      }))),
      catchError(error => {
        console.error('Error getting car locations:', error);
        this.errorSignal.set('Failed to get car locations. Please try again later.');
        return throwError(() => error);
      }),
      finalize(() => this.loadingSignal.set(false))
    );
  }
  
  /**
   * Get cars by status
   */
  getCarsByStatus(status: CarStatus): Car[] {
    return this.carsSignal().filter(car => car.status === status);
  }
  
  /**
   * Get cars by type
   */
  getCarsByType(type: CarType): Car[] {
    return this.carsSignal().filter(car => car.type === type);
  }
  
  /**
   * Search cars by term
   */
  searchCars(term: string): Car[] {
    if (!term) {
      return this.carsSignal();
    }
    
    const searchTerm = term.toLowerCase();
    return this.carsSignal().filter(car => 
      car.name.toLowerCase().includes(searchTerm) || 
      car.id.toLowerCase().includes(searchTerm) || 
      (car.licensePlate && car.licensePlate.toLowerCase().includes(searchTerm)) ||
      (car.model && car.model.toLowerCase().includes(searchTerm))
    );
  }
  
  /**
   * Clear error
   */
  clearError(): void {
    this.errorSignal.set(null);
  }
}