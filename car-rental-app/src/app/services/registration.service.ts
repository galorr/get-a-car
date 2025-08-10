import { Injectable, inject, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { User } from '../models/user.model';
import { environment } from '../../environments/environment';

@Injectable({
  // Use functional providers for better tree-shaking
  providedIn: 'root'
})
export class RegistrationService {
  // Signal state
  private usersSignal = signal<User[]>([]);
  private loadingSignal = signal<boolean>(false);
  private errorSignal = signal<string | null>(null);

  // Public signals for component consumption
  public isLoading = computed(() => this.loadingSignal());
  public error = computed(() => this.errorSignal());
  public users = computed(() => this.usersSignal());

  // Inject HttpClient
  private http = inject(HttpClient);

  /**
   * Register a new user
   */
  registerUser(userData: Omit<User, 'id'>): Observable<User> {
    // Set loading state
    this.loadingSignal.set(true);
    this.errorSignal.set(null);

    // In a real application, this would call an API
    // For development, we'll simulate a successful registration
    const newUser: User = {
      id: `user-${Date.now()}`,
      name: userData.name,
      email: userData.email,
      phone: userData.phone,
      registeredCars: userData.registeredCars || []
    };

    // Simulate API call with a delay
    return new Observable<User>(observer => {
      setTimeout(() => {
        try {
          // Add user to the collection
          this.usersSignal.update(users => [...users, newUser]);

          // Reset loading state
          this.loadingSignal.set(false);

          // Emit success
          observer.next(newUser);
          observer.complete();

          console.log('User registered:', newUser);
        } catch (error) {
          // Handle error
          console.error('Error registering user:', error);
          this.errorSignal.set('Failed to register user');
          this.loadingSignal.set(false);

          // Emit error
          observer.error(new Error('Failed to register user'));
        }
      }, 500); // Simulate network delay
    });
  }

  /**
   * Get all registered users
   */
  getUsers(): User[] {
    // Return users directly from signal
    return this.usersSignal();
  }

  /**
   * Get a user by ID
   */
  getUser(id: string): User | undefined {
    // Return user directly from signal
    return this.usersSignal().find(u => u.id === id);
  }

  /**
   * Register a car to a user
   */
  registerCarToUser(userId: string, carId: string): Observable<User> {
    // Set loading state
    this.loadingSignal.set(true);
    this.errorSignal.set(null);

    return new Observable<User>(observer => {
      setTimeout(() => {
        try {
          const users = this.usersSignal();
          const userIndex = users.findIndex(u => u.id === userId);

          if (userIndex === -1) {
            throw new Error('User not found');
          }

          const user = users[userIndex];

          // Check if car is already registered to this user
          if (user.registeredCars.includes(carId)) {
            throw new Error('Car already registered to this user');
          }

          // Create updated user
          const updatedUser: User = {
            ...user,
            registeredCars: [...user.registeredCars, carId]
          };

          // Update users signal
          this.usersSignal.update(users =>
            users.map(u => u.id === userId ? updatedUser : u)
          );

          // Reset loading state
          this.loadingSignal.set(false);

          // Emit success
          observer.next(updatedUser);
          observer.complete();
        } catch (error: any) {
          // Handle error
          console.error('Error registering car to user:', error);
          this.errorSignal.set(error.message || 'Failed to register car to user');
          this.loadingSignal.set(false);

          // Emit error
          observer.error(error);
        }
      }, 500); // Simulate network delay
    });
  }

  /**
   * Unregister a car from a user
   */
  unregisterCarFromUser(userId: string, carId: string): Observable<User> {
    // Set loading state
    this.loadingSignal.set(true);
    this.errorSignal.set(null);

    return new Observable<User>(observer => {
      setTimeout(() => {
        try {
          const users = this.usersSignal();
          const userIndex = users.findIndex(u => u.id === userId);

          if (userIndex === -1) {
            throw new Error('User not found');
          }

          const user = users[userIndex];

          // Check if car is registered to this user
          if (!user.registeredCars.includes(carId)) {
            throw new Error('Car not registered to this user');
          }

          // Create updated user
          const updatedUser: User = {
            ...user,
            registeredCars: user.registeredCars.filter(id => id !== carId)
          };

          // Update users signal
          this.usersSignal.update(users =>
            users.map(u => u.id === userId ? updatedUser : u)
          );

          // Reset loading state
          this.loadingSignal.set(false);

          // Emit success
          observer.next(updatedUser);
          observer.complete();
        } catch (error: any) {
          // Handle error
          console.error('Error unregistering car from user:', error);
          this.errorSignal.set(error.message || 'Failed to unregister car from user');
          this.loadingSignal.set(false);

          // Emit error
          observer.error(error);
        }
      }, 500); // Simulate network delay
    });
  }
}
