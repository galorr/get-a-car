import { Injectable, signal, computed, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, throwError, catchError, map, tap, finalize } from 'rxjs';
import { User, UserRole, UserStatus, UserResponse, UserRequest, mapUserResponseToUser, mapUserToUserRequest, UserRegistrationRequest, CarAssignmentRequest, DriverLicense } from '../models/user.model';
import { CarDataService } from './car-data.service';
import { ApiService } from './api.service';
import { API_ENDPOINTS, GetUserResponse, GetUsersResponse, CreateUserResponse, UpdateUserResponse, DeleteUserResponse, RegisterUserResponse, AssignCarToUserResponse, UnassignCarFromUserResponse } from '../models/api.model';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class RegistrationService {
  // Signal for the collection of users
  private usersSignal = signal<User[]>([]);
  
  // Signal for the current user
  private currentUserIdSignal = signal<string | null>(null);
  
  // Signal for loading state
  private loadingSignal = signal<boolean>(false);
  
  // Signal for error state
  private errorSignal = signal<string | null>(null);
  
  // Signal for registration form visibility
  private registrationFormVisibleSignal = signal<boolean>(false);
  
  // Signal for registration form position
  private registrationFormPositionSignal = signal<{ x: number; y: number }>({ x: 20, y: 20 });
  
  // Signal for registration form minimized state
  private registrationFormMinimizedSignal = signal<boolean>(false);
  
  // Computed signal for the current user
  public currentUser = computed(() => {
    const currentId = this.currentUserIdSignal();
    return currentId ? this.usersSignal().find(user => user.id === currentId) || null : null;
  });
  
  // Computed signal for loading state
  public isLoading = computed(() => this.loadingSignal());
  
  // Computed signal for error state
  public error = computed(() => this.errorSignal());
  
  // Computed signal for registration form visibility
  public isRegistrationFormVisible = computed(() => this.registrationFormVisibleSignal());
  
  // Computed signal for registration form position
  public registrationFormPosition = computed(() => this.registrationFormPositionSignal());
  
  // Computed signal for registration form minimized state
  public isRegistrationFormMinimized = computed(() => this.registrationFormMinimizedSignal());
  
  // Computed signal for active users
  public activeUsers = computed(() => 
    this.usersSignal().filter(user => user.status === UserStatus.ACTIVE || user.status === undefined)
  );
  
  // Computed signal for users with registered cars
  public usersWithCars = computed(() => 
    this.usersSignal().filter(user => user.registeredCars.length > 0)
  );
  
  private apiService = inject(ApiService);
  private http = inject(HttpClient);
  private carDataService = inject(CarDataService);
  
  constructor() {
    // Load initial user data
    this.loadUsers();
  }
  
  /**
   * Load users from API or mock data
   */
  loadUsers(): Observable<User[]> {
    this.loadingSignal.set(true);
    this.errorSignal.set(null);
    
    // Use mock data in development mode
    if (environment.mockDataEnabled) {
      return this.http.get<User[]>('assets/mock-data/users.json').pipe(
        tap(users => this.usersSignal.set(users)),
        catchError(error => {
          console.error('Error loading users:', error);
          this.errorSignal.set('Failed to load users. Please try again later.');
          return throwError(() => error);
        }),
        finalize(() => this.loadingSignal.set(false))
      );
    }
    
    // Use real API in production mode
    return this.apiService.get<GetUsersResponse>(API_ENDPOINTS.USERS, { useCache: true }).pipe(
      map(response => response.data.map(userResponse => mapUserResponseToUser(userResponse))),
      tap(users => this.usersSignal.set(users)),
      catchError(error => {
        console.error('Error loading users:', error);
        this.errorSignal.set('Failed to load users. Please try again later.');
        return throwError(() => error);
      }),
      finalize(() => this.loadingSignal.set(false))
    );
  }
  
  /**
   * Get all users
   */
  getUsers(): User[] {
    return this.usersSignal();
  }
  
  /**
   * Get a specific user by ID
   */
  getUser(id: string): User | undefined {
    return this.usersSignal().find(user => user.id === id);
  }
  
  /**
   * Get a specific user by ID from API
   */
  getUserFromApi(id: string): Observable<User> {
    this.loadingSignal.set(true);
    this.errorSignal.set(null);
    
    // Use mock data in development mode
    if (environment.mockDataEnabled) {
      return this.http.get<User[]>('assets/mock-data/users.json').pipe(
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
          this.errorSignal.set(`Failed to load user ${id}. Please try again later.`);
          return throwError(() => error);
        }),
        finalize(() => this.loadingSignal.set(false))
      );
    }
    
    // Use real API in production mode
    return this.apiService.get<GetUserResponse>(API_ENDPOINTS.USER_BY_ID(id), { useCache: true }).pipe(
      map(response => mapUserResponseToUser(response.data)),
      tap(user => {
        // Update the user in the signal if it exists
        this.updateUser(user);
        // Set as current user
        this.setCurrentUser(user.id);
      }),
      catchError(error => {
        console.error(`Error loading user ${id}:`, error);
        this.errorSignal.set(`Failed to load user ${id}. Please try again later.`);
        return throwError(() => error);
      }),
      finalize(() => this.loadingSignal.set(false))
    );
  }
  
  /**
   * Set the current user
   */
  setCurrentUser(id: string | null): void {
    this.currentUserIdSignal.set(id);
  }
  
  /**
   * Show registration form
   */
  showRegistrationForm(): void {
    this.registrationFormVisibleSignal.set(true);
    this.registrationFormMinimizedSignal.set(false);
  }
  
  /**
   * Hide registration form
   */
  hideRegistrationForm(): void {
    this.registrationFormVisibleSignal.set(false);
  }
  
  /**
   * Toggle registration form visibility
   */
  toggleRegistrationForm(): void {
    this.registrationFormVisibleSignal.update(visible => !visible);
    if (this.registrationFormVisibleSignal()) {
      this.registrationFormMinimizedSignal.set(false);
    }
  }
  
  /**
   * Set registration form position
   */
  setRegistrationFormPosition(x: number, y: number): void {
    this.registrationFormPositionSignal.set({ x, y });
  }
  
  /**
   * Minimize registration form
   */
  minimizeRegistrationForm(): void {
    this.registrationFormMinimizedSignal.set(true);
  }
  
  /**
   * Restore registration form
   */
  restoreRegistrationForm(): void {
    this.registrationFormMinimizedSignal.set(false);
  }
  
  /**
   * Toggle registration form minimized state
   */
  toggleRegistrationFormMinimized(): void {
    this.registrationFormMinimizedSignal.update(minimized => !minimized);
  }
  
  /**
   * Register a new user
   */
  registerUser(user: User): void {
    // In a real app, this would make an API call
    this.usersSignal.update(users => [...users, user]);
    this.setCurrentUser(user.id);
  }
  
  /**
   * Register a new user in the API
   */
  registerUserInApi(registrationData: UserRegistrationRequest): Observable<User> {
    this.loadingSignal.set(true);
    this.errorSignal.set(null);
    
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
          this.usersSignal.update(users => [...users, user]);
          this.setCurrentUser(user.id);
        }),
        catchError(error => {
          console.error('Error registering user:', error);
          this.errorSignal.set('Failed to register user. Please try again later.');
          return throwError(() => error);
        }),
        finalize(() => this.loadingSignal.set(false))
      );
    }
    
    // Use real API in production mode
    return this.apiService.post<RegisterUserResponse>(API_ENDPOINTS.USER_REGISTER, registrationData, {
      invalidateCache: true,
      cachePattern: API_ENDPOINTS.USERS
    }).pipe(
      map(response => mapUserResponseToUser(response.data)),
      tap(user => {
        this.usersSignal.update(users => [...users, user]);
        this.setCurrentUser(user.id);
      }),
      catchError(error => {
        console.error('Error registering user:', error);
        this.errorSignal.set('Failed to register user. Please try again later.');
        return throwError(() => error);
      }),
      finalize(() => this.loadingSignal.set(false))
    );
  }
  
  /**
   * Update a user
   */
  updateUser(updatedUser: User): void {
    this.usersSignal.update(users => 
      users.map(user => user.id === updatedUser.id ? updatedUser : user)
    );
  }
  
  /**
   * Update a user in the API
   */
  updateUserInApi(user: User): Observable<User> {
    this.loadingSignal.set(true);
    this.errorSignal.set(null);
    
    // Use mock data in development mode
    if (environment.mockDataEnabled) {
      // Simulate API call
      return of(user).pipe(
        tap(updatedUser => this.updateUser(updatedUser)),
        catchError(error => {
          console.error(`Error updating user ${user.id}:`, error);
          this.errorSignal.set(`Failed to update user ${user.id}. Please try again later.`);
          return throwError(() => error);
        }),
        finalize(() => this.loadingSignal.set(false))
      );
    }
    
    // Use real API in production mode
    const userRequest = mapUserToUserRequest(user);
    
    return this.apiService.put<UpdateUserResponse>(API_ENDPOINTS.USER_BY_ID(user.id), userRequest, {
      invalidateCache: true,
      cachePattern: API_ENDPOINTS.USERS
    }).pipe(
      map(response => mapUserResponseToUser(response.data)),
      tap(updatedUser => this.updateUser(updatedUser)),
      catchError(error => {
        console.error(`Error updating user ${user.id}:`, error);
        this.errorSignal.set(`Failed to update user ${user.id}. Please try again later.`);
        return throwError(() => error);
      }),
      finalize(() => this.loadingSignal.set(false))
    );
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
   * Register a car to a user in the API
   */
  registerCarToUserInApi(userId: string, carId: string): Observable<void> {
    this.loadingSignal.set(true);
    this.errorSignal.set(null);
    
    // Use mock data in development mode
    if (environment.mockDataEnabled) {
      // Simulate API call
      return of(undefined).pipe(
        tap(() => this.registerCarToUser(userId, carId)),
        catchError(error => {
          console.error(`Error registering car ${carId} to user ${userId}:`, error);
          this.errorSignal.set(`Failed to register car ${carId} to user ${userId}. Please try again later.`);
          return throwError(() => error);
        }),
        finalize(() => this.loadingSignal.set(false))
      );
    }
    
    // Use real API in production mode
    const assignmentRequest: CarAssignmentRequest = {
      userId,
      carId
    };
    
    return this.apiService.post<AssignCarToUserResponse>(API_ENDPOINTS.USER_CAR_ASSIGNMENT(userId, carId), assignmentRequest, {
      invalidateCache: true,
      cachePattern: API_ENDPOINTS.USERS
    }).pipe(
      map(() => undefined),
      tap(() => this.registerCarToUser(userId, carId)),
      catchError(error => {
        console.error(`Error registering car ${carId} to user ${userId}:`, error);
        this.errorSignal.set(`Failed to register car ${carId} to user ${userId}. Please try again later.`);
        return throwError(() => error);
      }),
      finalize(() => this.loadingSignal.set(false))
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
  
  /**
   * Unregister a car from a user in the API
   */
  unregisterCarFromUserInApi(userId: string, carId: string): Observable<void> {
    this.loadingSignal.set(true);
    this.errorSignal.set(null);
    
    // Use mock data in development mode
    if (environment.mockDataEnabled) {
      // Simulate API call
      return of(undefined).pipe(
        tap(() => this.unregisterCarFromUser(userId, carId)),
        catchError(error => {
          console.error(`Error unregistering car ${carId} from user ${userId}:`, error);
          this.errorSignal.set(`Failed to unregister car ${carId} from user ${userId}. Please try again later.`);
          return throwError(() => error);
        }),
        finalize(() => this.loadingSignal.set(false))
      );
    }
    
    // Use real API in production mode
    return this.apiService.delete<UnassignCarFromUserResponse>(API_ENDPOINTS.USER_CAR_ASSIGNMENT(userId, carId), {
      invalidateCache: true,
      cachePattern: API_ENDPOINTS.USERS
    }).pipe(
      map(() => undefined),
      tap(() => this.unregisterCarFromUser(userId, carId)),
      catchError(error => {
        console.error(`Error unregistering car ${carId} from user ${userId}:`, error);
        this.errorSignal.set(`Failed to unregister car ${carId} from user ${userId}. Please try again later.`);
        return throwError(() => error);
      }),
      finalize(() => this.loadingSignal.set(false))
    );
  }
  
  /**
   * Get cars registered to a user
   */
  getUserCars(userId: string): string[] {
    const user = this.getUser(userId);
    return user ? user.registeredCars : [];
  }
  
  /**
   * Check if a car is registered to the current user
   */
  isCarRegisteredToCurrentUser(carId: string): boolean {
    const user = this.currentUser();
    return user ? user.registeredCars.includes(carId) : false;
  }
  
  /**
   * Get users by role
   */
  getUsersByRole(role: UserRole): User[] {
    return this.usersSignal().filter(user => user.role === role);
  }
  
  /**
   * Get users by status
   */
  getUsersByStatus(status: UserStatus): User[] {
    return this.usersSignal().filter(user => user.status === status);
  }
  
  /**
   * Search users by term
   */
  searchUsers(term: string): User[] {
    if (!term) {
      return this.usersSignal();
    }
    
    const searchTerm = term.toLowerCase();
    return this.usersSignal().filter(user => 
      user.name.toLowerCase().includes(searchTerm) || 
      user.email.toLowerCase().includes(searchTerm) || 
      (user.phone && user.phone.toLowerCase().includes(searchTerm))
    );
  }
  
  /**
   * Clear error
   */
  clearError(): void {
    this.errorSignal.set(null);
  }
}