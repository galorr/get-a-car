import { Injectable, signal, computed, effect, inject } from '@angular/core';
import { Car, CarStatus } from '../models/car.model';
import { HttpClient } from '@angular/common/http';
import { catchError, of } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class CarDataService {
  // Signal for the collection of cars
  private carsSignal = signal<Car[]>([]);

  // Loading and error state signals
  private loadingSignal = signal<boolean>(false);
  private errorSignal = signal<string | null>(null);

  // Public signals for component consumption
  public isLoading = computed(() => this.loadingSignal());
  public error = computed(() => this.errorSignal());

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

  // Expose all cars as a computed signal
  public allCars = computed(() => this.carsSignal());

  // Inject HttpClient
  private http = inject(HttpClient);

  constructor() {
    // Load initial data
    this.loadCars();
  }

  /**
   * Load cars from the API or mock data using HttpClient with Signals
   */
  loadCars(): void {
    this.loadingSignal.set(true);
    this.errorSignal.set(null);

    this.http.get<Car[]>('assets/mock-data/cars.json')
      .pipe(
        catchError(error => {
          console.error('Error loading car data:', error);
          this.errorSignal.set(error.message || 'Failed to load car data');

          // Provide fallback data
          const fallbackCars: Car[] = [
            {
              id: 'car-001',
              name: 'Toyota Camry',
              latitude: 51.505,
              longitude: -0.09,
              status: CarStatus.AVAILABLE,
              model: 'Camry',
              year: 2022,
              licensePlate: 'ABC-1234',
              lastUpdated: new Date()
            },
            {
              id: 'car-002',
              name: 'Honda Civic',
              latitude: 51.51,
              longitude: -0.1,
              status: CarStatus.RENTED,
              model: 'Civic',
              year: 2021,
              licensePlate: 'XYZ-5678',
              lastUpdated: new Date()
            },
            {
              id: 'car-003',
              name: 'Ford Mustang',
              latitude: 51.515,
              longitude: -0.08,
              status: CarStatus.AVAILABLE,
              model: 'Mustang GT',
              year: 2023,
              licensePlate: 'MUS-2023',
              lastUpdated: new Date()
            }
          ];
          return of(fallbackCars);
        })
      )
      .subscribe({
        next: (cars) => {
          // Convert string dates to Date objects
          const processedCars = cars.map(car => ({
            ...car,
            lastUpdated: new Date(car.lastUpdated)
          }));

          this.updateCars(processedCars);
          this.loadingSignal.set(false);
        },
        error: (error) => {
          this.errorSignal.set(error.message || 'Failed to load car data');
          this.loadingSignal.set(false);
        }
      });
  }

  /**
   * Get a car by ID
   */
  getCar(id: string): Car | undefined {
    return this.carsSignal().find(car => car.id === id);
  }

  /**
   * Update the entire collection of cars
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
  addCar(car: Car): void {
    this.carsSignal.update(cars => [...cars, car]);
  }

  /**
   * Remove a car
   */
  removeCar(id: string): void {
    this.carsSignal.update(cars => cars.filter(car => car.id !== id));
  }

  /**
   * Update a car's location
   */
  updateCarLocation(id: string, latitude: number, longitude: number): void {
    this.carsSignal.update(cars =>
      cars.map(car => {
        if (car.id === id) {
          return {
            ...car,
            latitude,
            longitude,
            lastUpdated: new Date()
          };
        }
        return car;
      })
    );
  }

  /**
   * Update a car's status
   */
  updateCarStatus(id: string, status: CarStatus): void {
    this.carsSignal.update(cars =>
      cars.map(car => {
        if (car.id === id) {
          return {
            ...car,
            status,
            lastUpdated: new Date()
          };
        }
        return car;
      })
    );
  }
}
