import { Injectable, signal, computed, inject } from '@angular/core';
import { Observable, of, throwError, catchError, map, tap, finalize } from 'rxjs';
import { environment } from '../../environments/environment';
import { HttpService } from './http.service';
import { CacheService } from './cache.service';
import {
  API_ENDPOINTS,
  GetCarsResponse,
  GetCarResponse,
  CreateCarResponse,
  UpdateCarResponse,
  DeleteCarResponse,
  UpdateCarLocationResponse,
  UpdateCarStatusResponse,
  GetAllCarLocationsResponse,
  GetUserResponse,
  GetUsersResponse,
  UpdateUserResponse,
  RegisterUserResponse,
  AssignCarToUserResponse,
  UnassignCarFromUserResponse,
  PaginationParams
} from '../models/api.model';
import {
  Car,
  CarStatus,
  mapCarResponseToCar,
  mapCarToCarRequest,
  CarLocationUpdateRequest,
  CarStatusUpdateRequest,
  CarLocation,
  CarFilter
} from '../models/car.model';
import {
  User,
  UserRole,
  UserStatus,
  mapUserResponseToUser,
  mapUserToUserRequest,
  UserRegistrationRequest,
  CarAssignmentRequest
} from '../models/user.model';

@Injectable({
  providedIn: 'root'
})
export class DataService {
  private httpService = inject(HttpService);
  private cacheService = inject(CacheService);

  // Car data signals
  private carsSignal = signal<Car[]>([]);
  private carLoadingSignal = signal<boolean>(false);
  private carErrorSignal = signal<string | null>(null);
  private selectedCarIdSignal = signal<string | null>(null);
  private carFilterSignal = signal<CarFilter>({});

  // User data signals
  private usersSignal = signal<User[]>([]);
  private userLoadingSignal = signal<boolean>(false);
  private userErrorSignal = signal<string | null>(null);
  private currentUserIdSignal = signal<string | null>(null);

  // Computed signals for cars
  public cars = computed(() => this.carsSignal());
  public isCarLoading = computed(() => this.carLoadingSignal());
  public carError = computed(() => this.carErrorSignal());
  public selectedCar = computed(() => {
    const selectedId = this.selectedCarIdSignal();
    return selectedId ? this.carsSignal().find(car => car.id === selectedId) || null : null;
  });
  public selectedCarId = computed(() => this.selectedCarIdSignal());
  public carFilter = computed(() => this.carFilterSignal());

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
  public filteredCars = computed(() => {
    const filter = this.carFilterSignal();
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

  // Computed signals for users
  public users = computed(() => this.usersSignal());
  public isUserLoading = computed(() => this.userLoadingSignal());
  public userError = computed(() => this.userErrorSignal());
  public currentUser = computed(() => {
    const currentId = this.currentUserIdSignal();
    return currentId ? this.usersSignal().find(user => user.id === currentId) || null : null;
  });
  public currentUserId = computed(() => this.currentUserIdSignal());
  public activeUsers = computed(() =>
    this.usersSignal().filter(user => user.status === UserStatus.ACTIVE || user.status === undefined)
  );
  public usersWithCars = computed(() =>
    this.usersSignal().filter(user => user.registeredCars.length > 0)
  );

  // ===== CACHE METHODS =====

  /**
   * Configure the cache service
   */
  configureCache(config: Partial<any>): void {
    this.cacheService.configure(config);
  }

  /**
   * Clear the entire cache
   */
  clearCache(): void {
    this.cacheService.clear();
  }

  // ===== HTTP CONFIGURATION METHODS =====

  /**
   * Configure retry behavior for failed requests
   */
  configureRetry(config: Partial<any>): void {
    this.httpService.configureRetry(config);
  }

  /**
   * Get the current retry configuration
   */
  getRetryConfig(): any {
    return this.httpService.getRetryConfig();
  }

  /**
   * Create pagination parameters
   */
  createPaginationParams(params: PaginationParams): Record<string, string> {
    return this.httpService.createPaginationParams(params);
  }

  // ===== CAR DATA METHODS =====

  /**
   * Select a car
   */
  selectCar(id: string | null): void {
    this.selectedCarIdSignal.set(id);
  }

  /**
   * Set filter for cars
   */
  setCarFilter(filter: CarFilter): void {
    this.carFilterSignal.set(filter);
  }

  /**
   * Update filter for cars
   */
  updateCarFilter(filter: Partial<CarFilter>): void {
    this.carFilterSignal.update(currentFilter => ({
      ...currentFilter,
      ...filter
    }));
  }

  /**
   * Reset filter for cars
   */
  resetCarFilter(): void {
    this.carFilterSignal.set({});
  }

  /**
   * Load cars from API or mock data
   */
  loadCars(): Observable<Car[]> {
    this.carLoadingSignal.set(true);
    this.carErrorSignal.set(null);

    // Use mock data in development mode
    if (environment.mockDataEnabled) {
      return this.httpService.get<Car[]>('/assets/mock-data/cars.json').pipe(
        tap(cars => {
          this.carsSignal.set(cars);
        }),
        catchError(error => {
          console.error('[DataService] loadCars: Error loading mock cars:', error);
          this.carErrorSignal.set('Failed to load cars. Please try again later.');
          return throwError(() => error);
        }),
        finalize(() => {
          this.carLoadingSignal.set(false);
        })
      );
    }

    // Use real API in production mode

    const cacheKey = API_ENDPOINTS.CARS;
    const cachedData = this.cacheService.get<Car[]>(cacheKey);
    if (cachedData) {
      this.carsSignal.set(cachedData);
      this.carLoadingSignal.set(false);
      return of(cachedData);
    }

    return this.httpService.get<GetCarsResponse>(API_ENDPOINTS.CARS).pipe(
      map(response => {
        return response.data.map(carResponse => mapCarResponseToCar(carResponse));
      }),
      tap(cars => {
        this.carsSignal.set(cars);
        this.cacheService.set(cacheKey, cars);
      }),
      catchError(error => {
        console.error('[DataService] loadCars: Error loading cars from API:', error);
        this.carErrorSignal.set('Failed to load cars. Please try again later.');
        return throwError(() => error);
      }),
      finalize(() => {
        this.carLoadingSignal.set(false);
      })
    );
  }

  /**
   * Get a specific car by ID from API
   */
  getCarFromApi(id: string): Observable<Car> {
    this.carLoadingSignal.set(true);
    this.carErrorSignal.set(null);

    // Use mock data in development mode
    if (environment.mockDataEnabled) {
      return this.httpService.get<Car[]>('/assets/mock-data/cars.json').pipe(
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
          this.carErrorSignal.set(`Failed to load car ${id}. Please try again later.`);
          return throwError(() => error);
        }),
        finalize(() => this.carLoadingSignal.set(false))
      );
    }

    // Use real API in production mode
    const cacheKey = API_ENDPOINTS.CAR_BY_ID(id);
    const cachedData = this.cacheService.get<Car>(cacheKey);
    if (cachedData) {
      this.updateCar(cachedData);
      this.selectCar(cachedData.id);
      this.carLoadingSignal.set(false);
      return of(cachedData);
    }

    return this.httpService.get<GetCarResponse>(API_ENDPOINTS.CAR_BY_ID(id)).pipe(
      map(response => mapCarResponseToCar(response.data)),
      tap(car => {
        // Update the car in the signal if it exists
        this.updateCar(car);
        // Select the car
        this.selectCar(car.id);
        // Cache the car
        this.cacheService.set(cacheKey, car);
      }),
      catchError(error => {
        console.error(`Error loading car ${id}:`, error);
        this.carErrorSignal.set(`Failed to load car ${id}. Please try again later.`);
        return throwError(() => error);
      }),
      finalize(() => this.carLoadingSignal.set(false))
    );
  }

  /**
   * Create a new car in the API
   */
  createCar(car: Car): Observable<Car> {
    this.carLoadingSignal.set(true);
    this.carErrorSignal.set(null);

    // Use mock data in development mode
    if (environment.mockDataEnabled) {
      // Simulate API call
      const newCar = {
        ...car,
        id: `car-${Date.now()}`, // Generate a unique ID
        lastUpdated: new Date()
      };

      return of(newCar).pipe(
        tap(createdCar => {
          this.addCar(createdCar);
        }),
        finalize(() => this.carLoadingSignal.set(false))
      );
    }

    // Use real API in production mode
    const carRequest = mapCarToCarRequest(car);

    return this.httpService.post<CreateCarResponse>(API_ENDPOINTS.CARS, carRequest).pipe(
      map(response => mapCarResponseToCar(response.data)),
      tap(createdCar => {
        this.addCar(createdCar);
        // Invalidate cache
        this.cacheService.removeByPattern(API_ENDPOINTS.CARS);
      }),
      catchError(error => {
        console.error('Error creating car:', error);
        this.carErrorSignal.set('Failed to create car. Please try again later.');
        return throwError(() => error);
      }),
      finalize(() => this.carLoadingSignal.set(false))
    );
  }

  /**
   * Update a car in the API
   */
  updateCarInApi(car: Car): Observable<Car> {
    this.carLoadingSignal.set(true);
    this.carErrorSignal.set(null);

    // Use mock data in development mode
    if (environment.mockDataEnabled) {
      // Simulate API call
      const updatedCar = {
        ...car,
        lastUpdated: new Date()
      };

      return of(updatedCar).pipe(
        tap(updatedCar => {
          this.updateCar(updatedCar);
        }),
        finalize(() => this.carLoadingSignal.set(false))
      );
    }

    // Use real API in production mode
    const carRequest = mapCarToCarRequest(car);

    return this.httpService.put<UpdateCarResponse>(API_ENDPOINTS.CAR_BY_ID(car.id), carRequest).pipe(
      map(response => mapCarResponseToCar(response.data)),
      tap(updatedCar => {
        this.updateCar(updatedCar);
        // Invalidate cache
        this.cacheService.removeByPattern(API_ENDPOINTS.CARS);
        this.cacheService.remove(API_ENDPOINTS.CAR_BY_ID(car.id));
      }),
      catchError(error => {
        console.error(`Error updating car ${car.id}:`, error);
        this.carErrorSignal.set(`Failed to update car ${car.id}. Please try again later.`);
        return throwError(() => error);
      }),
      finalize(() => this.carLoadingSignal.set(false))
    );
  }

  /**
   * Delete a car from the API
   */
  deleteCar(id: string): Observable<void> {
    this.carLoadingSignal.set(true);
    this.carErrorSignal.set(null);

    // Use mock data in development mode
    if (environment.mockDataEnabled) {
      // Simulate API call
      return of(undefined).pipe(
        tap(() => {
          this.removeCar(id);
        }),
        finalize(() => this.carLoadingSignal.set(false))
      );
    }

    // Use real API in production mode
    return this.httpService.delete<DeleteCarResponse>(API_ENDPOINTS.CAR_BY_ID(id)).pipe(
      map(() => undefined),
      tap(() => {
        this.removeCar(id);
        // Invalidate cache
        this.cacheService.removeByPattern(API_ENDPOINTS.CARS);
        this.cacheService.remove(API_ENDPOINTS.CAR_BY_ID(id));
      }),
      catchError(error => {
        console.error(`Error deleting car ${id}:`, error);
        this.carErrorSignal.set(`Failed to delete car ${id}. Please try again later.`);
        return throwError(() => error);
      }),
      finalize(() => this.carLoadingSignal.set(false))
    );
  }

  /**
   * Update a car's status in the API
   */
  updateCarStatusInApi(id: string, status: CarStatus): Observable<Car> {
    this.carLoadingSignal.set(true);
    this.carErrorSignal.set(null);

    // Use mock data in development mode
    if (environment.mockDataEnabled) {
      // Simulate API call by getting the car first
      return this.getCarFromApi(id).pipe(
        map(car => ({
          ...car,
          status,
          lastUpdated: new Date()
        })),
        tap(updatedCar => {
          this.updateCar(updatedCar);
        }),
        finalize(() => this.carLoadingSignal.set(false))
      );
    }

    // Use real API in production mode
    const statusRequest: CarStatusUpdateRequest = {
      status
    };

    return this.httpService.patch<UpdateCarStatusResponse>(API_ENDPOINTS.CAR_STATUS(id), statusRequest).pipe(
      map(response => mapCarResponseToCar(response.data)),
      tap(updatedCar => {
        this.updateCar(updatedCar);
        // Invalidate cache
        this.cacheService.removeByPattern(API_ENDPOINTS.CARS);
        this.cacheService.remove(API_ENDPOINTS.CAR_BY_ID(id));
      }),
      catchError(error => {
        console.error(`Error updating car status ${id}:`, error);
        this.carErrorSignal.set(`Failed to update car status ${id}. Please try again later.`);
        return throwError(() => error);
      }),
      finalize(() => this.carLoadingSignal.set(false))
    );
  }

  /**
   * Update a car's location in the API
   */
  updateCarLocationInApi(id: string, latitude: number, longitude: number): Observable<Car> {
    this.carLoadingSignal.set(true);
    this.carErrorSignal.set(null);

    // Use mock data in development mode
    if (environment.mockDataEnabled) {
      // Simulate API call by getting the car first
      return this.getCarFromApi(id).pipe(
        map(car => ({
          ...car,
          latitude,
          longitude,
          lastUpdated: new Date()
        })),
        tap(updatedCar => {
          this.updateCar(updatedCar);
        }),
        finalize(() => this.carLoadingSignal.set(false))
      );
    }

    // Use real API in production mode
    const locationRequest: CarLocationUpdateRequest = {
      latitude,
      longitude
    };

    return this.httpService.patch<UpdateCarLocationResponse>(API_ENDPOINTS.CAR_LOCATION(id), locationRequest).pipe(
      map(response => mapCarResponseToCar(response.data)),
      tap(updatedCar => {
        this.updateCar(updatedCar);
        // Invalidate cache
        this.cacheService.removeByPattern(API_ENDPOINTS.CARS);
        this.cacheService.remove(API_ENDPOINTS.CAR_BY_ID(id));
      }),
      catchError(error => {
        console.error(`Error updating car location ${id}:`, error);
        this.carErrorSignal.set(`Failed to update car location ${id}. Please try again later.`);
        return throwError(() => error);
      }),
      finalize(() => this.carLoadingSignal.set(false))
    );
  }

  /**
   * Get all car locations
   */
  getAllCarLocations(): Observable<CarLocation[]> {
    this.carLoadingSignal.set(true);
    this.carErrorSignal.set(null);

    // Use mock data in development mode
    if (environment.mockDataEnabled) {
      // Use existing cars data
      return this.loadCars().pipe(
        map(cars => cars.map(car => ({
          id: car.id,
          latitude: car.latitude,
          longitude: car.longitude,
          lastUpdated: car.lastUpdated
        }))),
        finalize(() => this.carLoadingSignal.set(false))
      );
    }

    // Use real API in production mode
    const cacheKey = API_ENDPOINTS.CAR_LOCATIONS;
    const cachedData = this.cacheService.get<CarLocation[]>(cacheKey);
    if (cachedData) {
      this.carLoadingSignal.set(false);
      return of(cachedData);
    }

    return this.httpService.get<GetAllCarLocationsResponse>(API_ENDPOINTS.CAR_LOCATIONS).pipe(
      map(response => response.data.locations.map(location => ({
        id: location.id,
        latitude: location.latitude,
        longitude: location.longitude,
        lastUpdated: new Date(location.lastUpdated)
      }))),
      tap(locations => {
        this.cacheService.set(cacheKey, locations);
      }),
      catchError(error => {
        console.error('Error getting car locations:', error);
        this.carErrorSignal.set('Failed to get car locations. Please try again later.');
        return throwError(() => error);
      }),
      finalize(() => this.carLoadingSignal.set(false))
    );
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

  // ===== USER DATA METHODS =====

  /**
   * Set the current user
   */
  setCurrentUser(id: string | null): void {
    this.currentUserIdSignal.set(id);
  }

  /**
   * Load users from API or mock data
   */
  loadUsers(): Observable<User[]> {
    this.userLoadingSignal.set(true);
    this.userErrorSignal.set(null);

    // Use mock data in development mode
    if (environment.mockDataEnabled) {

      return this.httpService.get<User[]>('/assets/mock-data/users.json').pipe(
        tap(users => {
          this.usersSignal.set(users);
        }),
        catchError(error => {
          console.error('[DataService] loadUsers: Error loading mock users:', error);
          this.userErrorSignal.set('Failed to load users. Please try again later.');
          return throwError(() => error);
        }),
        finalize(() => {
          this.userLoadingSignal.set(false);
        })
      );
    }

    // Use real API in production mode

    const cacheKey = API_ENDPOINTS.USERS;
    const cachedData = this.cacheService.get<User[]>(cacheKey);
    if (cachedData) {
      this.usersSignal.set(cachedData);
      this.userLoadingSignal.set(false);
      return of(cachedData);
    }

    return this.httpService.get<GetUsersResponse>(API_ENDPOINTS.USERS).pipe(
      map(response => {
        return response.data.map(userResponse => mapUserResponseToUser(userResponse));
      }),
      tap(users => {
        this.usersSignal.set(users);
        this.cacheService.set(cacheKey, users);
      }),
      catchError(error => {
        console.error('[DataService] loadUsers: Error loading users from API:', error);
        this.userErrorSignal.set('Failed to load users. Please try again later.');
        return throwError(() => error);
      }),
      finalize(() => {
        this.userLoadingSignal.set(false);
      })
    );
  }

  /**
   * Get a specific user by ID from API
   */
  getUserFromApi(id: string): Observable<User> {
    this.userLoadingSignal.set(true);
    this.userErrorSignal.set(null);

    // Use mock data in development mode
    if (environment.mockDataEnabled) {
      return this.httpService.get<User[]>('/assets/mock-data/users.json').pipe(
        map(users => {
          const user = users.find(u => u.id === id);
          if (!user) {
            throw new Error(`User with ID ${id} not found`);
          }
          return user;
        }),
        tap(user => {
          // Update the user in the signal if it exists
          this.updateUser(user);
          // Set as current user
          this.setCurrentUser(user.id);
        }),
        catchError(error => {
          console.error(`Error loading user ${id}:`, error);
          this.userErrorSignal.set(`Failed to load user ${id}. Please try again later.`);
          return throwError(() => error);
        }),
        finalize(() => this.userLoadingSignal.set(false))
      );
    }

    // Use real API in production mode
    const cacheKey = API_ENDPOINTS.USER_BY_ID(id);
    const cachedData = this.cacheService.get<User>(cacheKey);
    if (cachedData) {
      this.updateUser(cachedData);
      this.setCurrentUser(cachedData.id);
      this.userLoadingSignal.set(false);
      return of(cachedData);
    }

    return this.httpService.get<GetUserResponse>(API_ENDPOINTS.USER_BY_ID(id)).pipe(
      map(response => mapUserResponseToUser(response.data)),
      tap(user => {
        // Update the user in the signal if it exists
        this.updateUser(user);
        // Set as current user
        this.setCurrentUser(user.id);
        // Cache the user
        this.cacheService.set(cacheKey, user);
      }),
      catchError(error => {
        console.error(`Error loading user ${id}:`, error);
        this.userErrorSignal.set(`Failed to load user ${id}. Please try again later.`);
        return throwError(() => error);
      }),
      finalize(() => this.userLoadingSignal.set(false))
    );
  }

  /**
   * Register a new user in the API
   */
  registerUserInApi(registrationData: UserRegistrationRequest): Observable<User> {
    this.userLoadingSignal.set(true);
    this.userErrorSignal.set(null);

    // Use mock data in development mode
    if (environment.mockDataEnabled) {
      // Simulate API call
      const newUser: User = {
        id: `user-${Date.now()}`, // Generate a unique ID
        name: registrationData.name,
        email: registrationData.email,
        phone: registrationData.phone,
        address: registrationData.address,
        driverLicense: registrationData.driverLicense ? {
          ...registrationData.driverLicense,
          expirationDate: new Date(registrationData.driverLicense.expirationDate)
        } : undefined,
        registeredCars: [],
        role: UserRole.CUSTOMER,
        status: UserStatus.ACTIVE,
        createdAt: new Date(),
        lastLogin: new Date()
      };

      return of(newUser).pipe(
        tap(user => {
          this.addUser(user);
          this.setCurrentUser(user.id);
        }),
        finalize(() => this.userLoadingSignal.set(false))
      );
    }

    // Use real API in production mode
    return this.httpService.post<RegisterUserResponse>(API_ENDPOINTS.USER_REGISTER, registrationData).pipe(
      map(response => mapUserResponseToUser(response.data)),
      tap(user => {
        this.addUser(user);
        this.setCurrentUser(user.id);
        // Invalidate cache
        this.cacheService.removeByPattern(API_ENDPOINTS.USERS);
      }),
      catchError(error => {
        console.error('Error registering user:', error);
        this.userErrorSignal.set('Failed to register user. Please try again later.');
        return throwError(() => error);
      }),
      finalize(() => this.userLoadingSignal.set(false))
    );
  }

  /**
   * Update a user in the API
   */
  updateUserInApi(user: User): Observable<User> {
    this.userLoadingSignal.set(true);
    this.userErrorSignal.set(null);

    // Use mock data in development mode
    if (environment.mockDataEnabled) {
      // Simulate API call
      return of(user).pipe(
        tap(updatedUser => {
          this.updateUser(updatedUser);
        }),
        finalize(() => this.userLoadingSignal.set(false))
      );
    }

    // Use real API in production mode
    const userRequest = mapUserToUserRequest(user);

    return this.httpService.put<UpdateUserResponse>(API_ENDPOINTS.USER_BY_ID(user.id), userRequest).pipe(
      map(response => mapUserResponseToUser(response.data)),
      tap(updatedUser => {
        this.updateUser(updatedUser);
        // Invalidate cache
        this.cacheService.removeByPattern(API_ENDPOINTS.USERS);
        this.cacheService.remove(API_ENDPOINTS.USER_BY_ID(user.id));
      }),
      catchError(error => {
        console.error(`Error updating user ${user.id}:`, error);
        this.userErrorSignal.set(`Failed to update user ${user.id}. Please try again later.`);
        return throwError(() => error);
      }),
      finalize(() => this.userLoadingSignal.set(false))
    );
  }

  /**
   * Register a car to a user in the API
   */
  registerCarToUserInApi(userId: string, carId: string): Observable<void> {
    this.userLoadingSignal.set(true);
    this.userErrorSignal.set(null);

    // Use mock data in development mode
    if (environment.mockDataEnabled) {
      // Simulate API call
      return of(undefined).pipe(
        tap(() => {
          this.registerCarToUser(userId, carId);
        }),
        finalize(() => this.userLoadingSignal.set(false))
      );
    }

    // Use real API in production mode
    const assignmentRequest: CarAssignmentRequest = {
      userId,
      carId
    };

    return this.httpService.post<AssignCarToUserResponse>(API_ENDPOINTS.USER_CAR_ASSIGNMENT(userId, carId), assignmentRequest).pipe(
      map(() => undefined),
      tap(() => {
        this.registerCarToUser(userId, carId);
        // Invalidate cache
        this.cacheService.removeByPattern(API_ENDPOINTS.USERS);
        this.cacheService.remove(API_ENDPOINTS.USER_BY_ID(userId));
      }),
      catchError(error => {
        console.error(`Error registering car ${carId} to user ${userId}:`, error);
        this.userErrorSignal.set(`Failed to register car ${carId} to user ${userId}. Please try again later.`);
        return throwError(() => error);
      }),
      finalize(() => this.userLoadingSignal.set(false))
    );
  }

  /**
   * Unregister a car from a user in the API
   */
  unregisterCarFromUserInApi(userId: string, carId: string): Observable<void> {
    this.userLoadingSignal.set(true);
    this.userErrorSignal.set(null);

    // Use mock data in development mode
    if (environment.mockDataEnabled) {
      // Simulate API call
      return of(undefined).pipe(
        tap(() => {
          this.unregisterCarFromUser(userId, carId);
        }),
        finalize(() => this.userLoadingSignal.set(false))
      );
    }

    // Use real API in production mode
    return this.httpService.delete<UnassignCarFromUserResponse>(API_ENDPOINTS.USER_CAR_ASSIGNMENT(userId, carId)).pipe(
      map(() => undefined),
      tap(() => {
        this.unregisterCarFromUser(userId, carId);
        // Invalidate cache
        this.cacheService.removeByPattern(API_ENDPOINTS.USERS);
        this.cacheService.remove(API_ENDPOINTS.USER_BY_ID(userId));
      }),
      catchError(error => {
        console.error(`Error unregistering car ${carId} from user ${userId}:`, error);
        this.userErrorSignal.set(`Failed to unregister car ${carId} from user ${userId}. Please try again later.`);
        return throwError(() => error);
      }),
      finalize(() => this.userLoadingSignal.set(false))
    );
  }

  /**
   * Update users
   */
  updateUsers(users: User[]): void {
    this.usersSignal.set(users);
  }

  /**
   * Update a single user
   */
  updateUser(updatedUser: User): void {
    this.usersSignal.update(users =>
      users.map(user => user.id === updatedUser.id ? updatedUser : user)
    );
  }

  /**
   * Add a new user
   */
  addUser(newUser: User): void {
    this.usersSignal.update(users => [...users, newUser]);
  }

  /**
   * Register a car to a user
   */
  registerCarToUser(userId: string, carId: string): void {
    this.usersSignal.update(users =>
      users.map(user => {
        if (user.id === userId && !user.registeredCars.includes(carId)) {
          return {
            ...user,
            registeredCars: [...user.registeredCars, carId]
          };
        }
        return user;
      })
    );
  }

  /**
   * Unregister a car from a user
   */
  unregisterCarFromUser(userId: string, carId: string): void {
    this.usersSignal.update(users =>
      users.map(user => {
        if (user.id === userId) {
          return {
            ...user,
            registeredCars: user.registeredCars.filter(id => id !== carId)
          };
        }
        return user;
      })
    );
  }
}
