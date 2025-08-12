import { Injectable, inject, signal, computed } from '@angular/core';
import type { Observable } from 'rxjs';

import { DataService } from './data.service';
import type {
  User,
  UserRole,
  UserStatus,
  UserRegistrationRequest,
} from '../models/user.model';

@Injectable({
  providedIn: 'root',
})
export class RegistrationService {
  private dataService = inject(DataService);

  // Registration form UI state signals
  private registrationFormVisibleSignal = signal<boolean>(false);
  private registrationFormPositionSignal = signal<{ x: number; y: number }>({
    x: 20,
    y: 20,
  });
  private registrationFormMinimizedSignal = signal<boolean>(false);

  // Computed signals for registration form UI state
  public isRegistrationFormVisible = computed(() =>
    this.registrationFormVisibleSignal()
  );
  public registrationFormPosition = computed(() =>
    this.registrationFormPositionSignal()
  );
  public isRegistrationFormMinimized = computed(() =>
    this.registrationFormMinimizedSignal()
  );

  constructor() {
    console.log('[RegistrationService] Constructor initialized');
    console.log('[RegistrationService] Constructor completed');
  }

  // ===== USER DATA METHODS (DELEGATED TO DATA SERVICE) =====

  /**
   * Get the current user
   */
  get currentUser() {
    return this.dataService.currentUser;
  }

  /**
   * Get all users
   */
  getUsers(): User[] {
    return this.dataService.users();
  }

  /**
   * Get a specific user by ID
   */
  getUser(id: string): User | undefined {
    return this.dataService.users().find(user => user.id === id);
  }

  /**
   * Get a specific user by ID from API
   */
  getUserFromApi(id: string): Observable<User> {
    return this.dataService.getUserFromApi(id);
  }

  /**
   * Set the current user
   */
  setCurrentUser(id: string | null): void {
    this.dataService.setCurrentUser(id);
  }

  /**
   * Register a new user in the API
   */
  registerUserInApi(
    registrationData: UserRegistrationRequest
  ): Observable<User> {
    return this.dataService.registerUserInApi(registrationData);
  }

  /**
   * Update a user in the API
   */
  updateUserInApi(user: User): Observable<User> {
    return this.dataService.updateUserInApi(user);
  }

  /**
   * Register a car to a user in the API
   */
  registerCarToUserInApi(userId: string, carId: string): Observable<void> {
    return this.dataService.registerCarToUserInApi(userId, carId);
  }

  /**
   * Unregister a car from a user in the API
   */
  unregisterCarFromUserInApi(userId: string, carId: string): Observable<void> {
    return this.dataService.unregisterCarFromUserInApi(userId, carId);
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
    return this.dataService.users().filter(user => user.role === role);
  }

  /**
   * Get users by status
   */
  getUsersByStatus(status: UserStatus): User[] {
    return this.dataService.users().filter(user => user.status === status);
  }

  /**
   * Search users by term
   */
  searchUsers(term: string): User[] {
    if (!term) {
      return this.dataService.users();
    }

    const searchTerm = term.toLowerCase();
    return this.dataService
      .users()
      .filter(
        user =>
          user.name.toLowerCase().includes(searchTerm) ||
          user.email.toLowerCase().includes(searchTerm) ||
          (user.phone && user.phone.toLowerCase().includes(searchTerm))
      );
  }

  // ===== REGISTRATION FORM UI METHODS =====

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
    this.registrationFormVisibleSignal.update((visible: boolean) => !visible);
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
    this.registrationFormMinimizedSignal.update(
      (minimized: boolean) => !minimized
    );
  }

  /**
   * Update all users
   */
  updateUsers(users: User[]): void {
    this.dataService.updateUsers(users);
  }
}
