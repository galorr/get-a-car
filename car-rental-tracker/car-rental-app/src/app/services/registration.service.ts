import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, throwError } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { User } from '../models/user.model';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class RegistrationService {
  private users: User[] = [];

  constructor(private http: HttpClient) { }

  /**
   * Register a new user
   */
  registerUser(userData: Omit<User, 'id'>): Observable<User> {
    // In a real application, this would call an API
    // For development, we'll simulate a successful registration

    const newUser: User = {
      id: `user-${Date.now()}`,
      name: userData.name,
      email: userData.email,
      phone: userData.phone,
      registeredCars: userData.registeredCars || []
    };

    // Simulate API call
    return of(newUser).pipe(
      tap(user => {
        this.users.push(user);
        console.log('User registered:', user);
      }),
      catchError(error => {
        console.error('Error registering user:', error);
        return throwError(() => new Error('Failed to register user'));
      })
    );
  }

  /**
   * Get all registered users
   */
  getUsers(): Observable<User[]> {
    // In a real application, this would call an API
    return of(this.users);
  }

  /**
   * Get a user by ID
   */
  getUser(id: string): Observable<User | undefined> {
    // In a real application, this would call an API
    const user = this.users.find(u => u.id === id);
    return of(user);
  }

  /**
   * Register a car to a user
   */
  registerCarToUser(userId: string, carId: string): Observable<User> {
    // In a real application, this would call an API
    const userIndex = this.users.findIndex(u => u.id === userId);

    if (userIndex === -1) {
      return throwError(() => new Error('User not found'));
    }

    const user = this.users[userIndex];

    // Check if car is already registered to this user
    if (user.registeredCars.includes(carId)) {
      return throwError(() => new Error('Car already registered to this user'));
    }

    // Add car to user's registered cars
    const updatedUser: User = {
      ...user,
      registeredCars: [...user.registeredCars, carId]
    };

    // Update user in the array
    this.users[userIndex] = updatedUser;

    return of(updatedUser);
  }

  /**
   * Unregister a car from a user
   */
  unregisterCarFromUser(userId: string, carId: string): Observable<User> {
    // In a real application, this would call an API
    const userIndex = this.users.findIndex(u => u.id === userId);

    if (userIndex === -1) {
      return throwError(() => new Error('User not found'));
    }

    const user = this.users[userIndex];

    // Check if car is registered to this user
    if (!user.registeredCars.includes(carId)) {
      return throwError(() => new Error('Car not registered to this user'));
    }

    // Remove car from user's registered cars
    const updatedUser: User = {
      ...user,
      registeredCars: user.registeredCars.filter(id => id !== carId)
    };

    // Update user in the array
    this.users[userIndex] = updatedUser;

    return of(updatedUser);
  }
}
