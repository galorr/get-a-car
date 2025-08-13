import type { HttpClient } from '@angular/common/http';
import type { Observable } from 'rxjs';
import { of } from 'rxjs';

import type { ApiResponse, PaginatedResponse } from '../app/models/api.model';
import type { Car } from '../app/models/car.model';
import type { User } from '../app/models/user.model';

// Mock cars data
export const MOCK_CARS: Car[] = [
  {
    id: 'car-001',
    name: 'Toyota Corolla',
    latitude: 51.505,
    longitude: -0.09,
    status: 'available' as any,
    model: 'Corolla',
    year: 2022,
    licensePlate: 'ABC-1234',
    lastUpdated: new Date('2025-08-10T12:00:00Z'),
    type: 'sedan' as any,
    fuelLevel: 85,
    mileage: 12500,
    color: 'Silver',
    features: ['Bluetooth', 'Backup Camera', 'Cruise Control'],
    rentalRate: 45,
    imageUrl: 'assets/images/cars/toyota-corolla.jpg',
  },
  {
    id: 'car-002',
    name: 'Honda Civic',
    latitude: 51.51,
    longitude: -0.1,
    status: 'rented' as any,
    model: 'Civic',
    year: 2023,
    licensePlate: 'DEF-5678',
    lastUpdated: new Date('2025-08-10T12:30:00Z'),
    type: 'sedan' as any,
    fuelLevel: 72,
    mileage: 8750,
    color: 'Blue',
    features: ['Apple CarPlay', 'Android Auto', 'Lane Assist'],
    rentalRate: 48,
    imageUrl: 'assets/images/cars/honda-civic.jpg',
  },
  {
    id: 'car-003',
    name: 'Ford Focus',
    latitude: 51.515,
    longitude: -0.08,
    status: 'maintenance' as any,
    model: 'Focus',
    year: 2021,
    licensePlate: 'GHI-9012',
    lastUpdated: new Date('2025-08-10T11:45:00Z'),
    type: 'hatchback' as any,
    fuelLevel: 45,
    mileage: 24680,
    color: 'Red',
    features: ['Bluetooth', 'Heated Seats', 'Keyless Entry'],
    rentalRate: 42,
    imageUrl: 'assets/images/cars/ford-focus.jpg',
  },
];

// Mock users data
export const MOCK_USERS: User[] = [
  {
    id: 'user-001',
    name: 'John Doe',
    email: 'john.doe@example.com',
    phone: '555-123-4567',
    registeredCars: ['car-001', 'car-004'],
    role: 'customer' as any,
    status: 'active' as any,
    address: {
      street: '123 Main Street',
      city: 'London',
      state: 'Greater London',
      zipCode: 'SW1A 1AA',
      country: 'United Kingdom',
    },
    driverLicense: {
      number: 'DL12345678',
      state: 'Greater London',
      expirationDate: new Date('2027-05-15T00:00:00Z'),
      imageUrl: 'assets/images/licenses/license-001.jpg',
    },
    paymentMethods: [
      {
        id: 'pm-001',
        type: 'credit_card',
        lastFour: '4242',
        expirationDate: '05/27',
        isDefault: true,
      },
      {
        id: 'pm-002',
        type: 'paypal',
        isDefault: false,
      },
    ],
    createdAt: new Date('2024-01-15T10:30:00Z'),
    lastLogin: new Date('2025-08-09T14:25:00Z'),
  },
  {
    id: 'user-002',
    name: 'Jane Smith',
    email: 'jane.smith@example.com',
    phone: '555-987-6543',
    registeredCars: ['car-002', 'car-007', 'car-013'],
    role: 'admin' as any,
    status: 'active' as any,
    address: {
      street: '456 Park Avenue',
      city: 'London',
      state: 'Greater London',
      zipCode: 'E1 6AN',
      country: 'United Kingdom',
    },
    driverLicense: {
      number: 'DL87654321',
      state: 'Greater London',
      expirationDate: new Date('2028-08-22T00:00:00Z'),
      imageUrl: 'assets/images/licenses/license-002.jpg',
    },
    paymentMethods: [
      {
        id: 'pm-003',
        type: 'credit_card',
        lastFour: '1234',
        expirationDate: '09/28',
        isDefault: true,
      },
    ],
    createdAt: new Date('2023-11-05T09:15:00Z'),
    lastLogin: new Date('2025-08-10T08:45:00Z'),
  },
];

// Mock API responses
export class MockApiResponses {
  // Cars API responses
  static getCarsResponse(): ApiResponse<PaginatedResponse<any>> {
    return {
      data: {
        data: MOCK_CARS.map(car => ({
          ...car,
          lastUpdated: car.lastUpdated.toISOString(),
        })),
        total: MOCK_CARS.length,
        page: 1,
        limit: 10,
        totalPages: 1,
      },
      success: true,
      message: 'Cars retrieved successfully',
      timestamp: new Date().toISOString(),
    };
  }

  static getCarByIdResponse(id: string): ApiResponse<any> {
    const car = MOCK_CARS.find(c => c.id === id);
    return {
      data: car
        ? {
            ...car,
            lastUpdated: car.lastUpdated.toISOString(),
          }
        : null,
      success: !!car,
      message: car ? 'Car retrieved successfully' : 'Car not found',
      timestamp: new Date().toISOString(),
    };
  }

  // Users API responses
  static getUsersResponse(): ApiResponse<PaginatedResponse<any>> {
    return {
      data: {
        data: MOCK_USERS.map(user => ({
          ...user,
          driverLicense: user.driverLicense
            ? {
                ...user.driverLicense,
                expirationDate: user.driverLicense.expirationDate.toISOString(),
              }
            : undefined,
          createdAt: user.createdAt?.toISOString(),
          lastLogin: user.lastLogin?.toISOString(),
        })),
        total: MOCK_USERS.length,
        page: 1,
        limit: 10,
        totalPages: 1,
      },
      success: true,
      message: 'Users retrieved successfully',
      timestamp: new Date().toISOString(),
    };
  }

  static getUserByIdResponse(id: string): ApiResponse<any> {
    const user = MOCK_USERS.find(u => u.id === id);
    return {
      data: user
        ? {
            ...user,
            driverLicense: user.driverLicense
              ? {
                  ...user.driverLicense,
                  expirationDate:
                    user.driverLicense.expirationDate.toISOString(),
                }
              : undefined,
            createdAt: user.createdAt?.toISOString(),
            lastLogin: user.lastLogin?.toISOString(),
          }
        : null,
      success: !!user,
      message: user ? 'User retrieved successfully' : 'User not found',
      timestamp: new Date().toISOString(),
    };
  }
}

// Mock HttpClient for testing
export class MockHttpClient {
  get(url: string): Observable<any> {
    if (url.includes('/api/cars') && !url.includes('/api/cars/')) {
      return of(MockApiResponses.getCarsResponse());
    } else if (url.includes('/api/cars/')) {
      const id = url.split('/').pop();
      return of(MockApiResponses.getCarByIdResponse(id || ''));
    } else if (url.includes('/api/users') && !url.includes('/api/users/')) {
      return of(MockApiResponses.getUsersResponse());
    } else if (url.includes('/api/users/')) {
      const id = url.split('/').pop();
      return of(MockApiResponses.getUserByIdResponse(id || ''));
    }
    return of(null);
  }

  post(url: string, body: any): Observable<any> {
    return of({
      data: body,
      success: true,
      message: 'Operation successful',
      timestamp: new Date().toISOString(),
    });
  }

  put(url: string, body: any): Observable<any> {
    return of({
      data: body,
      success: true,
      message: 'Operation successful',
      timestamp: new Date().toISOString(),
    });
  }

  delete(url: string): Observable<any> {
    return of({
      data: { id: url.split('/').pop() },
      success: true,
      message: 'Operation successful',
      timestamp: new Date().toISOString(),
    });
  }

  patch(url: string, body: any): Observable<any> {
    return of({
      data: body,
      success: true,
      message: 'Operation successful',
      timestamp: new Date().toISOString(),
    });
  }
}

// Factory function to create a mock HttpClient
export function createMockHttpClient(): HttpClient {
  return new MockHttpClient() as unknown as HttpClient;
}
