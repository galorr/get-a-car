import { Component, signal, inject, ChangeDetectionStrategy, ChangeDetectorRef, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { RegistrationService } from '../../services/registration.service';
import { CarDataService } from '../../services/car-data.service';
import { User } from '../../models/user.model';
import { Car, CarStatus } from '../../models/car.model';

@Component({
  selector: 'app-registration',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './registration.component.html',
  styleUrls: ['./registration.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class RegistrationComponent {
  private registrationService = inject(RegistrationService);
  private carDataService = inject(CarDataService);
  private cdr = inject(ChangeDetectorRef);

  // UI state signals
  isMinimized = signal(false);
  position = signal({ x: 20, y: 20 });
  isDragging = signal(false);
  dragOffset = signal({ x: 0, y: 0 });

  // Form data
  newUser: User = {
    id: '',
    name: '',
    email: '',
    phone: '',
    registeredCars: []
  };

  // Selected car and user
  selectedCar = signal<Car | null>(null);
  currentUser = signal<User | null>(null);

  // Form validation
  formErrors = signal<{name?: string; email?: string}>({});

  constructor() {
    // Setup effect to track selected car changes
    effect(() => {
      const car = this.carDataService.selectedCar();
      this.selectedCar.set(car);

      // If panel is minimized and a car is selected, maximize it
      if (car && this.isMinimized()) {
        this.isMinimized.set(false);
      }

      this.cdr.detectChanges();
    });

    // Setup effect to track current user changes
    effect(() => {
      const user = this.registrationService.currentUser();
      this.currentUser.set(user);
      this.cdr.detectChanges();
    });
  }

  toggleMinimize(): void {
    this.isMinimized.update(value => !value);
  }

  startDrag(event: MouseEvent): void {
    if (event.target instanceof HTMLElement &&
        (event.target.classList.contains('panel-header') ||
         event.target.parentElement?.classList.contains('panel-header'))) {
      this.isDragging.set(true);
      const rect = (event.currentTarget as HTMLElement).getBoundingClientRect();
      this.dragOffset.set({
        x: event.clientX - rect.left,
        y: event.clientY - rect.top
      });

      // Add event listeners for drag and drop
      document.addEventListener('mousemove', this.onDrag);
      document.addEventListener('mouseup', this.stopDrag);
    }
  }

  private onDrag = (event: MouseEvent): void => {
    if (this.isDragging()) {
      const offset = this.dragOffset();

      // Calculate new position
      let newX = event.clientX - offset.x;
      let newY = event.clientY - offset.y;

      // Get window dimensions
      const windowWidth = window.innerWidth;
      const windowHeight = window.innerHeight;

      // Get panel dimensions
      const panel = document.querySelector('.registration-panel') as HTMLElement;
      const panelWidth = panel?.offsetWidth || 300;
      const panelHeight = panel?.offsetHeight || 400;

      // Constrain to window boundaries
      newX = Math.max(0, Math.min(windowWidth - panelWidth, newX));
      newY = Math.max(0, Math.min(windowHeight - 40, newY)); // Allow some overflow at bottom

      this.position.set({
        x: newX,
        y: newY
      });
    }
  };

  private stopDrag = (): void => {
    this.isDragging.set(false);
    document.removeEventListener('mousemove', this.onDrag);
    document.removeEventListener('mouseup', this.stopDrag);
  };

  validateForm(): boolean {
    const errors: {name?: string; email?: string} = {};

    if (!this.newUser.name) {
      errors.name = 'Name is required';
    }

    if (!this.newUser.email) {
      errors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(this.newUser.email)) {
      errors.email = 'Please enter a valid email address';
    }

    this.formErrors.set(errors);
    return Object.keys(errors).length === 0;
  }

  registerUser(): void {
    if (!this.validateForm()) {
      return;
    }

    // Generate a unique ID
    this.newUser.id = `user-${Date.now()}`;

    // Register the user
    const registrationRequest = {
      name: this.newUser.name,
      email: this.newUser.email,
      phone: this.newUser.phone,
      address: this.newUser.address,
      driverLicense: this.newUser.driverLicense ? {
        number: this.newUser.driverLicense.number,
        state: this.newUser.driverLicense.state,
        expirationDate: this.newUser.driverLicense.expirationDate.toISOString(),
        imageUrl: this.newUser.driverLicense.imageUrl
      } : undefined
    };

    this.registrationService.registerUserInApi(registrationRequest).subscribe({
      next: (user) => {
        console.log('User registered successfully:', user);
        this.registrationService.setCurrentUser(user.id);
      },
      error: (error) => {
        console.error('Error registering user:', error);
      }
    });

    // Reset the form
    this.newUser = {
      id: '',
      name: '',
      email: '',
      phone: '',
      registeredCars: []
    };

    // Clear form errors
    this.formErrors.set({});

    // Update current user
    this.currentUser.set(this.registrationService.currentUser());
    this.cdr.detectChanges();
  }

  registerCarToCurrentUser(): void {
    const user = this.currentUser();
    const car = this.selectedCar();

    if (user && car) {
      this.registrationService.registerCarToUserInApi(user.id, car.id).subscribe({
        next: () => {
          console.log('Car registered to user successfully');
        },
        error: (error) => {
          console.error('Error registering car to user:', error);
        }
      });
      this.currentUser.set(this.registrationService.currentUser());
      this.cdr.detectChanges();
    }
  }

  unregisterCar(carId: string): void {
    const user = this.currentUser();

    if (user) {
      this.registrationService.unregisterCarFromUserInApi(user.id, carId).subscribe({
        next: () => {
          console.log('Car unregistered from user successfully');
        },
        error: (error) => {
          console.error('Error unregistering car from user:', error);
        }
      });
      this.currentUser.set(this.registrationService.currentUser());
      this.cdr.detectChanges();
    }
  }

  isCarRegistered(carId: string): boolean {
    return this.registrationService.isCarRegisteredToCurrentUser(carId);
  }

  getCarById(carId: string): Car | undefined {
    return this.carDataService.getCar(carId);
  }

  getStatusClass(status?: CarStatus): string {
    return status || '';
  }

  selectCar(carId: string): void {
    this.carDataService.selectCar(carId);
  }
}
