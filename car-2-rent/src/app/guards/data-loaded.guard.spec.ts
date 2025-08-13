import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import {
  ActivatedRouteSnapshot,
  Router,
  RouterStateSnapshot
} from '@angular/router';
import { of, throwError } from 'rxjs';
import { DataLoadedGuard } from './data-loaded.guard';
import { CarDataService } from '../services/car-data.service';
import { RegistrationService } from '../services/registration.service';
import { DataService } from '../services/data.service';
import { Car, CarStatus } from '../models/car.model';
import { User } from '../models/user.model';

describe('DataLoadedGuard', () => {
  let guard: DataLoadedGuard;
  let carDataServiceSpy: any;
  let registrationServiceSpy: any;
  let dataServiceSpy: any;
  let routerSpy: any;

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
      lastUpdated: new Date(),
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
      lastUpdated: new Date(),
    },
  ];

  const dummyUsers: User[] = [
    {
      id: '1',
      name: 'John Doe',
      email: 'john@example.com',
      phone: '123-456-7890',
      registeredCars: [],
    },
    {
      id: '2',
      name: 'Jane Smith',
      email: 'jane@example.com',
      phone: '098-765-4321',
      registeredCars: ['1'],
    },
  ];

  const mockActivatedRouteSnapshot = {} as ActivatedRouteSnapshot;
  const mockRouterStateSnapshot = {} as RouterStateSnapshot;

  beforeEach(() => {
    const carDataSpy = {
      getCars: jest.fn(),
      loadCars: jest.fn(),
      updateCars: jest.fn(),
    };

    const registrationSpy = {
      loadUsers: jest.fn(),
      updateUsers: jest.fn(),
    };

    const dataSpy = {
      loadCars: jest.fn(),
      loadUsers: jest.fn(),
    };

    const router = {
      navigate: jest.fn(),
    };

    TestBed.configureTestingModule({
      imports: [
        HttpClientTestingModule
      ],
      providers: [
        DataLoadedGuard,
        { provide: CarDataService, useValue: carDataSpy },
        { provide: RegistrationService, useValue: registrationSpy },
        { provide: DataService, useValue: dataSpy },
        { provide: Router, useValue: router },
      ],
    });

    guard = TestBed.inject(DataLoadedGuard);
    carDataServiceSpy = TestBed.inject(CarDataService);
    registrationServiceSpy = TestBed.inject(RegistrationService);
    dataServiceSpy = TestBed.inject(DataService);
    routerSpy = TestBed.inject(Router);
  });

  it('should be created', () => {
    expect(guard).toBeTruthy();
  });

  it('should allow activation when car data is already loaded', done => {
    // Arrange
    carDataServiceSpy.getCars.mockReturnValue(dummyCars);

    // Act
    const result = guard.canActivate(
      mockActivatedRouteSnapshot,
      mockRouterStateSnapshot
    );

    // Assert
    result.subscribe(canActivate => {
      expect(canActivate).toBe(true);
      expect(dataServiceSpy.loadCars).not.toHaveBeenCalled();
      expect(dataServiceSpy.loadUsers).not.toHaveBeenCalled();
      done();
    });
  });

  it('should load car data and allow activation when data is not loaded but loads successfully', done => {
    // Arrange
    carDataServiceSpy.getCars.mockReturnValue([]);
    dataServiceSpy.loadCars.mockReturnValue(of(dummyCars));
    dataServiceSpy.loadUsers.mockReturnValue(of(dummyUsers));

    // Act
    const result = guard.canActivate(
      mockActivatedRouteSnapshot,
      mockRouterStateSnapshot
    );

    // Assert
    result.subscribe(canActivate => {
      expect(canActivate).toBe(true);
      expect(dataServiceSpy.loadCars).toHaveBeenCalled();
      expect(dataServiceSpy.loadUsers).toHaveBeenCalled();
      expect(routerSpy.navigate).not.toHaveBeenCalled();
      done();
    });
  });

  it('should navigate to map and prevent activation when car data is empty after loading', done => {
    // Arrange
    carDataServiceSpy.getCars.mockReturnValue([]);
    dataServiceSpy.loadCars.mockReturnValue(of([])); // Empty array after loading
    dataServiceSpy.loadUsers.mockReturnValue(of(dummyUsers));

    // Act
    const result = guard.canActivate(
      mockActivatedRouteSnapshot,
      mockRouterStateSnapshot
    );

    // Assert
    result.subscribe(canActivate => {
      expect(canActivate).toBe(false);
      expect(dataServiceSpy.loadCars).toHaveBeenCalled();
      expect(dataServiceSpy.loadUsers).toHaveBeenCalled();
      expect(routerSpy.navigate).toHaveBeenCalledWith(['/map']);
      done();
    });
  });

  it('should handle errors when loading car data and navigate to map', done => {
    // Arrange
    const errorMessage = 'Error loading cars';
    carDataServiceSpy.getCars.mockReturnValue([]);
    dataServiceSpy.loadCars.mockReturnValue(
      throwError(() => new Error(errorMessage))
    );
    dataServiceSpy.loadUsers.mockReturnValue(of(dummyUsers));

    // Act
    const result = guard.canActivate(
      mockActivatedRouteSnapshot,
      mockRouterStateSnapshot
    );

    // Assert
    result.subscribe(canActivate => {
      expect(canActivate).toBe(false);
      expect(dataServiceSpy.loadCars).toHaveBeenCalled();
      expect(routerSpy.navigate).toHaveBeenCalledWith(['/map']);
      done();
    });
  });

  it('should handle errors when loading user data and navigate to map', done => {
    // Arrange
    carDataServiceSpy.getCars.mockReturnValue([]);
    dataServiceSpy.loadCars.mockReturnValue(of(dummyCars));
    dataServiceSpy.loadUsers.mockReturnValue(
      throwError(() => new Error('User loading error'))
    );

    // Act
    const result = guard.canActivate(
      mockActivatedRouteSnapshot,
      mockRouterStateSnapshot
    );

    // Assert
    result.subscribe(canActivate => {
      expect(canActivate).toBe(false); // Should not activate when user data fails to load
      expect(dataServiceSpy.loadCars).toHaveBeenCalled();
      expect(dataServiceSpy.loadUsers).toHaveBeenCalled();
      expect(routerSpy.navigate).toHaveBeenCalledWith(['/map']);
      done();
    });
  });
});
