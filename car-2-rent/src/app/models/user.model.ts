export enum UserRole {
  CUSTOMER = 'customer',
  ADMIN = 'admin',
  STAFF = 'staff'
}

export enum UserStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  SUSPENDED = 'suspended'
}

export interface User {
  id: string;
  name: string;
  email: string;
  phone?: string;
  registeredCars: string[];
  role?: UserRole;
  status?: UserStatus;
  address?: Address;
  driverLicense?: DriverLicense;
  paymentMethods?: PaymentMethod[];
  createdAt?: Date;
  lastLogin?: Date;
}

export interface Address {
  street: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
}

export interface DriverLicense {
  number: string;
  state: string;
  expirationDate: Date;
  imageUrl?: string;
}

export interface PaymentMethod {
  id: string;
  type: 'credit_card' | 'debit_card' | 'paypal';
  lastFour?: string;
  expirationDate?: string;
  isDefault: boolean;
}

// API Interfaces
export interface UserResponse {
  id: string;
  name: string;
  email: string;
  phone?: string;
  registeredCars: string[];
  role?: string;
  status?: string;
  address?: Address;
  driverLicense?: {
    number: string;
    state: string;
    expirationDate: string;
    imageUrl?: string;
  };
  paymentMethods?: PaymentMethod[];
  createdAt?: string;
  lastLogin?: string;
}

export interface UserRequest {
  name: string;
  email: string;
  phone?: string;
  role?: string;
  status?: string;
  address?: Address;
  driverLicense?: {
    number: string;
    state: string;
    expirationDate: string;
    imageUrl?: string;
  };
}

export interface UserRegistrationRequest {
  name: string;
  email: string;
  phone?: string;
  address?: Address;
  driverLicense?: {
    number: string;
    state: string;
    expirationDate: string;
    imageUrl?: string;
  };
}

export interface CarAssignmentRequest {
  userId: string;
  carId: string;
}

// Mapper functions
export function mapUserResponseToUser(response: UserResponse): User {
  return {
    ...response,
    role: response.role as UserRole,
    status: response.status as UserStatus,
    driverLicense: response.driverLicense ? {
      ...response.driverLicense,
      expirationDate: new Date(response.driverLicense.expirationDate)
    } : undefined,
    createdAt: response.createdAt ? new Date(response.createdAt) : undefined,
    lastLogin: response.lastLogin ? new Date(response.lastLogin) : undefined
  };
}

export function mapUserToUserRequest(user: User): UserRequest {
  return {
    name: user.name,
    email: user.email,
    phone: user.phone,
    role: user.role,
    status: user.status,
    address: user.address,
    driverLicense: user.driverLicense ? {
      number: user.driverLicense.number,
      state: user.driverLicense.state,
      expirationDate: user.driverLicense.expirationDate.toISOString(),
      imageUrl: user.driverLicense.imageUrl
    } : undefined
  };
}