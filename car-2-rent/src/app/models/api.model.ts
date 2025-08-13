import { CarResponse, CarRequest, CarLocationUpdateRequest, CarStatusUpdateRequest } from './car.model';
import { UserResponse, UserRequest, UserRegistrationRequest, CarAssignmentRequest } from './user.model';

// Generic API response interface
export interface ApiResponse<T> {
  data: T;
  success: boolean;
  message?: string;
  timestamp: string;
}

// Pagination interfaces
export interface PaginationParams {
  page: number;
  limit: number;
  sortBy?: string;
  sortDirection?: 'asc' | 'desc';
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// Car API interfaces
export interface GetCarsResponse extends PaginatedResponse<CarResponse> {}

export interface GetCarResponse extends ApiResponse<CarResponse> {}

export interface CreateCarResponse extends ApiResponse<CarResponse> {}

export interface UpdateCarResponse extends ApiResponse<CarResponse> {}

export interface DeleteCarResponse extends ApiResponse<{ id: string }> {}

export interface UpdateCarLocationResponse extends ApiResponse<CarResponse> {}

export interface UpdateCarStatusResponse extends ApiResponse<CarResponse> {}

export interface GetAllCarLocationsResponse extends ApiResponse<{
  locations: Array<{
    id: string;
    latitude: number;
    longitude: number;
    lastUpdated: string;
  }>;
}> {}

// User API interfaces
export interface GetUsersResponse extends PaginatedResponse<UserResponse> {}

export interface GetUserResponse extends ApiResponse<UserResponse> {}

export interface CreateUserResponse extends ApiResponse<UserResponse> {}

export interface UpdateUserResponse extends ApiResponse<UserResponse> {}

export interface DeleteUserResponse extends ApiResponse<{ id: string }> {}

export interface RegisterUserResponse extends ApiResponse<UserResponse> {}

export interface AssignCarToUserResponse extends ApiResponse<{
  userId: string;
  carId: string;
  success: boolean;
}> {}

export interface UnassignCarFromUserResponse extends ApiResponse<{
  userId: string;
  carId: string;
  success: boolean;
}> {}

// Error interfaces
export interface ApiError {
  code: string;
  message: string;
  details?: any;
}

// Cache control
export interface CacheConfig {
  ttl: number; // Time to live in milliseconds
  maxSize: number; // Maximum number of items in cache
  excludedUrls?: string[]; // URLs to exclude from caching
}

// API endpoints
export const API_ENDPOINTS = {
  // Car endpoints
  CARS: '/api/cars',
  CAR_BY_ID: (id: string) => `/api/cars/${id}`,
  CAR_LOCATION: (id: string) => `/api/cars/${id}/location`,
  CAR_STATUS: (id: string) => `/api/cars/${id}/status`,
  CAR_LOCATIONS: '/api/cars/locations',
  
  // User endpoints
  USERS: '/api/users',
  USER_BY_ID: (id: string) => `/api/users/${id}`,
  USER_REGISTER: '/api/users/register',
  USER_CARS: (id: string) => `/api/users/${id}/cars`,
  USER_CAR_ASSIGNMENT: (userId: string, carId: string) => `/api/users/${userId}/cars/${carId}`
};

// HTTP headers
export const DEFAULT_HEADERS = {
  'Content-Type': 'application/json',
  'Accept': 'application/json'
};

// Retry configuration
export interface RetryConfig {
  maxRetries: number;
  delayMs: number;
  retryableStatusCodes: number[];
}

export const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxRetries: 3,
  delayMs: 1000,
  retryableStatusCodes: [408, 429, 500, 502, 503, 504]
};