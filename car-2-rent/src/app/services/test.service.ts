import { Injectable, inject } from '@angular/core';
import { CarDataService } from './car-data.service';
import { MapService } from './map.service';
import { RegistrationService } from './registration.service';
import { Car, CarStatus, CarType } from '../models/car.model';
import { User, UserRole, UserStatus } from '../models/user.model';
import { Observable, forkJoin, of, catchError, finalize, tap, map } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class TestService {
  private carDataService = inject(CarDataService);
  private mapService = inject(MapService);
  private registrationService = inject(RegistrationService);
  
  /**
   * Test all services with mock data
   */
  testAllServices(): Observable<{ success: boolean; message: string }> {
    // Load initial data
    return forkJoin([
      this.carDataService.loadCars(),
      this.registrationService.loadUsers()
    ]).pipe(
      tap(() => console.log('Initial data loaded')),
      tap(() => this.testCarDataService()),
      tap(() => this.testMapService()),
      tap(() => this.testRegistrationService()),
      tap(() => this.testIntegration()),
      map(() => ({ 
        success: true, 
        message: 'All tests passed successfully!' 
      })),
      catchError(error => {
        console.error('Test failed:', error);
        return of({ 
          success: false, 
          message: `Test failed: ${error.message || 'Unknown error'}` 
        });
      })
    );
  }
  
  /**
   * Test CarDataService
   */
  private testCarDataService(): void {
    console.log('Testing CarDataService...');
    
    // Test getting all cars
    const cars = this.carDataService.getCars();
    if (!cars || cars.length === 0) {
      throw new Error('No cars found');
    }
    console.log(`Found ${cars.length} cars`);
    
    // Test filtering cars
    const availableCars = this.carDataService.availableCars();
    console.log(`Found ${availableCars.length} available cars`);
    
    // Test selecting a car
    const firstCar = cars[0];
    this.carDataService.selectCar(firstCar.id);
    const selectedCar = this.carDataService.selectedCar();
    if (!selectedCar || selectedCar.id !== firstCar.id) {
      throw new Error('Car selection failed');
    }
    console.log(`Selected car: ${selectedCar.name}`);
    
    // Test filtering
    this.carDataService.setFilter({
      status: [CarStatus.AVAILABLE],
      sortBy: 'name',
      sortDirection: 'asc'
    });
    const filteredCars = this.carDataService.filteredCars();
    console.log(`Filtered to ${filteredCars.length} cars`);
    
    // Test searching
    const searchResults = this.carDataService.searchCars('Toyota');
    console.log(`Search found ${searchResults.length} cars`);
    
    console.log('CarDataService tests passed');
  }
  
  /**
   * Test MapService
   */
  private testMapService(): void {
    console.log('Testing MapService...');
    
    // Test map center and zoom
    const center = this.mapService.mapCenter();
    const zoom = this.mapService.mapZoom();
    console.log(`Map center: [${center[0]}, ${center[1]}], zoom: ${zoom}`);
    
    // Test visible statuses
    const visibleStatuses = this.mapService.visibleStatuses();
    console.log(`Visible statuses: ${visibleStatuses.join(', ')}`);
    
    // Test toggling status visibility
    this.mapService.toggleStatusVisibility(CarStatus.MAINTENANCE);
    const updatedVisibleStatuses = this.mapService.visibleStatuses();
    console.log(`Updated visible statuses: ${updatedVisibleStatuses.join(', ')}`);
    
    // Test markers
    const markers = this.mapService.markers();
    console.log(`Found ${markers.size} markers`);
    
    // Test visible markers
    const visibleMarkers = this.mapService.visibleMarkers();
    console.log(`Found ${visibleMarkers.length} visible markers`);
    
    // Test marker counts
    const markerCounts = this.mapService.markersCountByStatus();
    console.log(`Marker counts: ${JSON.stringify(markerCounts)}`);
    
    // Test fitting map to markers
    const bounds = this.mapService.fitMapToMarkers();
    if (bounds) {
      console.log(`Map bounds: N: ${bounds.north}, S: ${bounds.south}, E: ${bounds.east}, W: ${bounds.west}`);
    }
    
    console.log('MapService tests passed');
  }
  
  /**
   * Test RegistrationService
   */
  private testRegistrationService(): void {
    console.log('Testing RegistrationService...');
    
    // Test getting all users
    const users = this.registrationService.getUsers();
    if (!users || users.length === 0) {
      throw new Error('No users found');
    }
    console.log(`Found ${users.length} users`);
    
    // Test setting current user
    const firstUser = users[0];
    this.registrationService.setCurrentUser(firstUser.id);
    const currentUser = this.registrationService.currentUser();
    if (!currentUser || currentUser.id !== firstUser.id) {
      throw new Error('User selection failed');
    }
    console.log(`Selected user: ${currentUser.name}`);
    
    // Test registration form controls
    this.registrationService.showRegistrationForm();
    console.log(`Registration form visible: ${this.registrationService.isRegistrationFormVisible()}`);
    
    this.registrationService.minimizeRegistrationForm();
    console.log(`Registration form minimized: ${this.registrationService.isRegistrationFormMinimized()}`);
    
    this.registrationService.restoreRegistrationForm();
    console.log(`Registration form minimized after restore: ${this.registrationService.isRegistrationFormMinimized()}`);
    
    this.registrationService.hideRegistrationForm();
    console.log(`Registration form visible after hide: ${this.registrationService.isRegistrationFormVisible()}`);
    
    // Test getting user cars
    const userCars = this.registrationService.getUserCars(firstUser.id);
    console.log(`User has ${userCars.length} registered cars`);
    
    // Test filtering users
    const activeUsers = this.registrationService.activeUsers();
    console.log(`Found ${activeUsers.length} active users`);
    
    const usersWithCars = this.registrationService.usersWithCars();
    console.log(`Found ${usersWithCars.length} users with cars`);
    
    console.log('RegistrationService tests passed');
  }
  
  /**
   * Test integration between services
   */
  private testIntegration(): void {
    console.log('Testing service integration...');
    
    // Test car selection integration
    const cars = this.carDataService.getCars();
    const firstCar = cars[0];
    
    // Select car in car data service
    this.carDataService.selectCar(firstCar.id);
    
    // Check if map service has selected the marker
    const selectedMarkerId = this.mapService.selectedMarkerId();
    if (selectedMarkerId !== firstCar.id) {
      throw new Error('Car selection integration with map failed');
    }
    console.log(`Car selection integration: Car ${firstCar.id} selected in both services`);
    
    // Test car registration integration
    const users = this.registrationService.getUsers();
    const firstUser = users[0];
    
    // Check if a car is registered to the current user
    this.registrationService.setCurrentUser(firstUser.id);
    const isRegistered = this.registrationService.isCarRegisteredToCurrentUser(firstCar.id);
    console.log(`Car ${firstCar.id} is${isRegistered ? '' : ' not'} registered to user ${firstUser.id}`);
    
    console.log('Integration tests passed');
  }
}