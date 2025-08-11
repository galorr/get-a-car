export enum CarStatus {
  AVAILABLE = 'available',
  RENTED = 'rented',
  MAINTENANCE = 'maintenance',
  INACTIVE = 'inactive'
}

export enum CarType {
  SEDAN = 'sedan',
  SUV = 'suv',
  HATCHBACK = 'hatchback',
  TRUCK = 'truck',
  VAN = 'van',
  LUXURY = 'luxury',
  ELECTRIC = 'electric',
  HYBRID = 'hybrid'
}

export interface Car {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  status: CarStatus;
  model?: string;
  year?: number;
  licensePlate?: string;
  lastUpdated: Date;
  type?: CarType;
  fuelLevel?: number;
  mileage?: number;
  color?: string;
  features?: string[];
  rentalRate?: number;
  imageUrl?: string;
}

export interface CarLocation {
  id: string;
  latitude: number;
  longitude: number;
  lastUpdated: Date;
}

export interface CarFilter {
  status?: CarStatus[];
  type?: CarType[];
  year?: { min?: number; max?: number };
  rentalRate?: { min?: number; max?: number };
  searchTerm?: string;
  sortBy?: keyof Car;
  sortDirection?: 'asc' | 'desc';
}

// API Interfaces
export interface CarResponse {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  status: string;
  model?: string;
  year?: number;
  licensePlate?: string;
  lastUpdated: string;
  type?: string;
  fuelLevel?: number;
  mileage?: number;
  color?: string;
  features?: string[];
  rentalRate?: number;
  imageUrl?: string;
}

export interface CarRequest {
  name: string;
  latitude: number;
  longitude: number;
  status: string;
  model?: string;
  year?: number;
  licensePlate?: string;
  type?: string;
  fuelLevel?: number;
  mileage?: number;
  color?: string;
  features?: string[];
  rentalRate?: number;
  imageUrl?: string;
}

export interface CarLocationUpdateRequest {
  latitude: number;
  longitude: number;
}

export interface CarStatusUpdateRequest {
  status: string;
}

// Mapper functions
export function mapCarResponseToCar(response: CarResponse): Car {
  return {
    ...response,
    status: response.status as CarStatus,
    type: response.type as CarType,
    lastUpdated: new Date(response.lastUpdated)
  };
}

export function mapCarToCarRequest(car: Car): CarRequest {
  return {
    name: car.name,
    latitude: car.latitude,
    longitude: car.longitude,
    status: car.status,
    model: car.model,
    year: car.year,
    licensePlate: car.licensePlate,
    type: car.type,
    fuelLevel: car.fuelLevel,
    mileage: car.mileage,
    color: car.color,
    features: car.features,
    rentalRate: car.rentalRate,
    imageUrl: car.imageUrl
  };
}