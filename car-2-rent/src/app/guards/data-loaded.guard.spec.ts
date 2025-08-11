import { TestBed } from '@angular/core/testing';
import { ActivatedRouteSnapshot, Router, RouterStateSnapshot } from '@angular/router';
import { of, throwError } from 'rxjs';
import { DataLoadedGuard } from './data-loaded.guard';
import { CarDataService } from '../services/car-data.service';
import { RegistrationService } from '../services/registration.service';
import { Car, CarStatus } from '../models/car.model';
import { User } from '../models/user.model';

describe('DataLoadedGuard', () => {
  let guard: DataLoadedGuard;
  let carDataServiceSpy: jasmine.SpyObj<CarDataService>;
  let registrationServiceSpy: jasmine.SpyObj<RegistrationService>;
  let routerSpy: jasmine.SpyObj<Router>;
  
  const dummyCars: Car[] = [
    {
      id: '1',
      name: 'Toyota Corolla',
      model: 'Corolla',
      year: 2020,
      color: 'blue',
      latitude: 32.0853,
      longitude: 34.7818,
      status: CarStatus.AVAILABLE,
      lastUpdated: new Date()
    },
    {
      id: '2',
      name: 'Honda Civic',
      model: 'Civic',
      year: 2021,
      color: 'red',
      latitude: 32.0853,
      longitude: 34.7818,
      status: CarStatus.AVAILABLE,
      lastUpdated: new Date()
    }
  ];
  
  const dummyUsers: User[] = [
    {
      id: '1',
      name: 'John Doe',
      email: 'john@example.com',
      phone: '123-456-7890',
      registeredCars: []
    },
    {
      id: '2',
      name: 'Jane Smith',
      email: 'jane@example.com',
      phone: '098-765-4321',
      registeredCars: ['1']
    }
  ];
  
  const mockActivatedRouteSnapshot = {} as ActivatedRouteSnapshot;
  const mockRouterStateSnapshot = {} as RouterStateSnapshot;

  beforeEach(() => {
    const carDataSpy = jasmine.createSpyObj('CarDataService', ['getCars', 'loadCars']);
    const registrationSpy = jasmine.createSpyObj('RegistrationService', ['loadUsers']);
    const router = jasmine.createSpyObj('Router', ['navigate']);
    
    TestBed.configureTestingModule({
      providers: [
        DataLoadedGuard,
        { provide: CarDataService, useValue: carDataSpy },
        { provide: RegistrationService, useValue: registrationSpy },
        { provide: Router, useValue: router }
      ]
    });
    
    guard = TestBed.inject(DataLoadedGuard);
    carDataServiceSpy = TestBed.inject(CarDataService) as jasmine.SpyObj<CarDataService>;
    registrationServiceSpy = TestBed.inject(RegistrationService) as jasmine.SpyObj<RegistrationService>;
    routerSpy = TestBed.inject(Router) as jasmine.SpyObj<Router>;
  });

  it('should be created', () => {
    expect(guard).toBeTruthy();
  });

  it('should allow activation when car data is already loaded', (done) => {
    // Arrange
    carDataServiceSpy.getCars.and.returnValue(dummyCars);
    
    // Act
    const result = guard.canActivate(mockActivatedRouteSnapshot, mockRouterStateSnapshot);
    
    // Assert
    result.subscribe(canActivate => {
      expect(canActivate).toBeTrue();
      expect(carDataServiceSpy.loadCars).not.toHaveBeenCalled();
      expect(registrationServiceSpy.loadUsers).not.toHaveBeenCalled();
      done();
    });
  });

  it('should load car data and allow activation when data is not loaded but loads successfully', (done) => {
    // Arrange
    carDataServiceSpy.getCars.and.returnValue([]);
    carDataServiceSpy.loadCars.and.returnValue(of(dummyCars));
    registrationServiceSpy.loadUsers.and.returnValue(of(dummyUsers));
    
    // Act
    const result = guard.canActivate(mockActivatedRouteSnapshot, mockRouterStateSnapshot);
    
    // Assert
    result.subscribe(canActivate => {
      expect(canActivate).toBeTrue();
      expect(carDataServiceSpy.loadCars).toHaveBeenCalled();
      expect(registrationServiceSpy.loadUsers).toHaveBeenCalled();
      expect(routerSpy.navigate).not.toHaveBeenCalled();
      done();
    });
  });

  it('should navigate to map and prevent activation when car data is empty after loading', (done) => {
    // Arrange
    carDataServiceSpy.getCars.and.returnValue([]);
    carDataServiceSpy.loadCars.and.returnValue(of([])); // Empty array after loading
    registrationServiceSpy.loadUsers.and.returnValue(of(dummyUsers));
    
    // Act
    const result = guard.canActivate(mockActivatedRouteSnapshot, mockRouterStateSnapshot);
    
    // Assert
    result.subscribe(canActivate => {
      expect(canActivate).toBeFalse();
      expect(carDataServiceSpy.loadCars).toHaveBeenCalled();
      expect(registrationServiceSpy.loadUsers).toHaveBeenCalled();
      expect(routerSpy.navigate).toHaveBeenCalledWith(['/map']);
      done();
    });
  });

  it('should handle errors when loading car data and navigate to map', (done) => {
    // Arrange
    const errorMessage = 'Error loading cars';
    carDataServiceSpy.getCars.and.returnValue([]);
    carDataServiceSpy.loadCars.and.returnValue(throwError(() => new Error(errorMessage)));
    
    // Act
    const result = guard.canActivate(mockActivatedRouteSnapshot, mockRouterStateSnapshot);
    
    // Assert
    result.subscribe(canActivate => {
      expect(canActivate).toBeFalse();
      expect(carDataServiceSpy.loadCars).toHaveBeenCalled();
      expect(routerSpy.navigate).toHaveBeenCalledWith(['/map']);
      done();
    });
  });

  it('should still load users even if user loading fails', (done) => {
    // Arrange
    carDataServiceSpy.getCars.and.returnValue([]);
    carDataServiceSpy.loadCars.and.returnValue(of(dummyCars));
    registrationServiceSpy.loadUsers.and.returnValue(throwError(() => new Error('User loading error')));
    
    // Act
    const result = guard.canActivate(mockActivatedRouteSnapshot, mockRouterStateSnapshot);
    
    // Assert
    result.subscribe(canActivate => {
      expect(canActivate).toBeTrue(); // Should still activate since car data loaded successfully
      expect(carDataServiceSpy.loadCars).toHaveBeenCalled();
      expect(registrationServiceSpy.loadUsers).toHaveBeenCalled();
      expect(routerSpy.navigate).not.toHaveBeenCalled();
      done();
    });
  });
});