import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { Car, CarStatus, CarFilter } from '../models/car.model';
import { DataService } from './data.service';

@Injectable({
  providedIn: 'root'
})
export class CarDataService {
  private dataService = inject(DataService);

  /**
   * Initialize the service - should be called after all services are initialized
   * This prevents circular dependencies during initialization
   */
  initialize(): void {
    console.log('[CarDataService] Initialize method called');
  }

  // ===== DELEGATE METHODS TO DATA SERVICE =====

  /**
   * Load cars from API or mock data
   */
  loadCars(): Observable<Car[]> {
    return this.dataService.loadCars();
  }

  /**
   * Get all cars
   */
  getCars(): Car[] {
    return this.dataService.cars();
  }

  /**
   * Get a specific car by ID
   */
  getCar(id: string): Car | undefined {
    return this.dataService.cars().find(car => car.id === id);
  }

  /**
   * Get a specific car by ID from API
   */
  getCarFromApi(id: string): Observable<Car> {
    return this.dataService.getCarFromApi(id);
  }

  /**
   * Select a car
   */
  selectCar(id: string | null): void {
    this.dataService.selectCar(id);
  }

  /**
   * Get the selected car
   */
  get selectedCar() {
    return this.dataService.selectedCar;
  }

  /**
   * Set filter for cars
   */
  setFilter(filter: CarFilter): void {
    this.dataService.setCarFilter(filter);
  }

  /**
   * Update filter for cars
   */
  updateFilter(filter: Partial<CarFilter>): void {
    this.dataService.updateCarFilter(filter);
  }

  /**
   * Reset filter for cars
   */
  resetFilter(): void {
    this.dataService.resetCarFilter();
  }

  /**
   * Get filtered cars
   */
  get filteredCars() {
    return this.dataService.filteredCars;
  }

  /**
   * Get loading state
   */
  get isLoading() {
    return this.dataService.isCarLoading;
  }

  /**
   * Get error state
   */
  get error() {
    return this.dataService.carError;
  }

  /**
   * Get available cars
   */
  get availableCars() {
    return this.dataService.availableCars;
  }

  /**
   * Get rented cars
   */
  get rentedCars() {
    return this.dataService.rentedCars;
  }

  /**
   * Get maintenance cars
   */
  get maintenanceCars() {
    return this.dataService.maintenanceCars;
  }

  /**
   * Get inactive cars
   */
  get inactiveCars() {
    return this.dataService.inactiveCars;
  }

  /**
   * Update cars
   */
  updateCars(cars: Car[]): void {
    this.dataService.updateCars(cars);
  }

  /**
   * Update a single car
   */
  updateCar(updatedCar: Car): void {
    this.dataService.updateCar(updatedCar);
  }

  /**
   * Add a new car
   */
  addCar(newCar: Car): void {
    this.dataService.addCar(newCar);
  }

  /**
   * Create a new car in the API
   */
  createCar(car: Car): Observable<Car> {
    return this.dataService.createCar(car);
  }

  /**
   * Update a car in the API
   */
  updateCarInApi(car: Car): Observable<Car> {
    return this.dataService.updateCarInApi(car);
  }

  /**
   * Remove a car
   */
  removeCar(id: string): void {
    this.dataService.removeCar(id);
  }

  /**
   * Delete a car from the API
   */
  deleteCar(id: string): Observable<void> {
    return this.dataService.deleteCar(id);
  }

  /**
   * Update a car's status
   */
  updateCarStatus(id: string, status: CarStatus): void {
    this.dataService.updateCarStatus(id, status);
  }

  /**
   * Update a car's status in the API
   */
  updateCarStatusInApi(id: string, status: CarStatus): Observable<Car> {
    return this.dataService.updateCarStatusInApi(id, status);
  }

  /**
   * Update a car's location
   */
  updateCarLocation(id: string, latitude: number, longitude: number): void {
    this.dataService.updateCarLocation(id, latitude, longitude);
  }

  /**
   * Update a car's location in the API
   */
  updateCarLocationInApi(id: string, latitude: number, longitude: number): Observable<Car> {
    return this.dataService.updateCarLocationInApi(id, latitude, longitude);
  }

  /**
   * Get all car locations
   */
  getAllCarLocations(): Observable<{ id: string; latitude: number; longitude: number; lastUpdated: Date }[]> {
    return this.dataService.getAllCarLocations();
  }

  /**
   * Get cars by status
   */
  getCarsByStatus(status: CarStatus): Car[] {
    return this.dataService.cars().filter(car => car.status === status);
  }

  /**
   * Search cars by term
   */
  searchCars(term: string): Car[] {
    if (!term) {
      return this.dataService.cars();
    }

    const searchTerm = term.toLowerCase();
    return this.dataService.cars().filter(car =>
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
    // No direct way to clear error in DataService, so we'll just ignore this for now
  }
}
