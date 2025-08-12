/* eslint-disable complexity */
import { CommonModule } from '@angular/common';
import {
  Component,
  inject,
  signal,
  computed,
  input,
  output,
  effect,
  ChangeDetectionStrategy,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import type { FormGroup } from '@angular/forms';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import type { Car } from '../../models/car.model';
import { RegistrationService } from '../../services/registration.service';

@Component({
  selector: 'app-side-nav',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './side-nav.component.html',
  styleUrls: ['./side-nav.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SideNavComponent {
  // Panel state using signals
  isExpanded = signal(false);
  activeSection = signal<'registration' | 'alerts' | 'settings'>(
    'registration'
  );

  // Selected car using signal input
  selectedCar = input<Car | null>(null);

  // Computed signal to check if a car is selected
  hasSelectedCar = computed(() => !!this.selectedCar());

  // Events using output
  close = output<void>();

  // Registration Form
  registrationForm: FormGroup;
  formErrors = signal({
    name: '',
    email: '',
    address: '',
    license: '',
    preferredCarType: '',
    rentalDuration: '',
    pickupLocation: '',
  });

  // Submission state
  isSubmitting = signal(false);
  submissionSuccess = signal(false);
  submissionError = signal<string | null>(null);

  // Services
  private fb = inject(FormBuilder);
  private registrationService = inject(RegistrationService);

  constructor() {
    // Initialize form
    this.registrationForm = this.fb.group({
      name: ['', [Validators.required]],
      email: ['', [Validators.required, Validators.email]],
      phone: [''],
      address: ['', [Validators.required]],
      license: ['', [Validators.required]],
      preferredCarType: ['', [Validators.required]],
      rentalDuration: ['', [Validators.required, Validators.min(1)]],
      pickupLocation: ['', [Validators.required]],
    });

    // Effect to handle selected car changes
    effect(() => {
      const car = this.selectedCar();
      if (car) {
        this.isExpanded.set(true);
        this.activeSection.set('registration');
      }
    });

    // Subscribe to form value changes for validation using takeUntilDestroyed
    this.registrationForm.valueChanges
      .pipe(takeUntilDestroyed())
      .subscribe(() => {
        this.validateForm();
      });
  }

  /**
   * Toggle expanded state
   */
  toggleExpand(): void {
    this.isExpanded.update(value => !value);

    // If expanding, set the active section to registration by default
    if (this.isExpanded()) {
      this.activeSection.set('registration');
    }
  }

  /**
   * Set active section
   */
  setActiveSection(section: 'registration' | 'alerts' | 'settings'): void {
    // Only change section if it's different from current active section
    if (this.activeSection() !== section) {
      this.activeSection.set(section);
      this.isExpanded.set(true);
    }
  }

  /**
   * Close the panel
   */
  closePanel(): void {
    this.close.emit();
  }

  /**
   * Handle form submission
   */
  onSubmit(): void {
    if (this.registrationForm.valid && this.selectedCar()) {
      this.isSubmitting.set(true);
      this.submissionError.set(null);

      const userData = {
        ...this.registrationForm.value,
        registeredCars: [this.selectedCar()!.id],
      };

      // Use effect to handle async operation
      this.registrationService
        .registerUserInApi(userData)
        .pipe(takeUntilDestroyed())
        .subscribe({
          next: () => {
            this.isSubmitting.set(false);
            this.submissionSuccess.set(true);

            // // Reset form after successful submission
            // setTimeout(() => {
            //   this.resetForm();
            // }, 2000);
          },
          error: (error: { message: any }) => {
            this.isSubmitting.set(false);
            this.submissionError.set(
              error.message || 'Failed to register user'
            );
          },
        });
    } else {
      // Mark all fields as touched to trigger validation
      this.markFormGroupTouched(this.registrationForm);
    }
  }

  /**
   * Reset the form and state
   */
  private resetForm(): void {
    this.registrationForm.reset();
    this.submissionSuccess.set(false);
    this.submissionError.set(null);

    // Clear validation errors
    this.formErrors.set({
      name: '',
      email: '',
      address: '',
      license: '',
      preferredCarType: '',
      rentalDuration: '',
      pickupLocation: '',
    });
  }

  /**
   * Validate the form and update error messages
   */
  private validateForm(): void {
    const form = this.registrationForm;
    const errors = { ...this.formErrors() };

    // Clear previous errors
    errors.name = '';
    errors.email = '';
    errors.address = '';
    errors.license = '';
    errors.preferredCarType = '';
    errors.rentalDuration = '';
    errors.pickupLocation = '';

    // Check for validation errors
    if (form.get('name')?.invalid && form.get('name')?.touched) {
      errors.name = 'Name is required';
    }

    if (form.get('email')?.invalid && form.get('email')?.touched) {
      // eslint-disable-next-line dot-notation
      if (form.get('email')?.errors?.['required']) {
        errors.email = 'Email is required';
      // eslint-disable-next-line dot-notation
      } else if (form.get('email')?.errors?.['email']) {
        errors.email = 'Please enter a valid email address';
      }
    }

    if (form.get('address')?.invalid && form.get('address')?.touched) {
      errors.address = 'Address is required';
    }

    if (form.get('license')?.invalid && form.get('license')?.touched) {
      errors.license = "Driver's license is required";
    }

    if (
      form.get('preferredCarType')?.invalid &&
      form.get('preferredCarType')?.touched
    ) {
      errors.preferredCarType = 'Preferred car type is required';
    }

    if (
      form.get('rentalDuration')?.invalid &&
      form.get('rentalDuration')?.touched
    ) {
      // eslint-disable-next-line dot-notation
      if (form.get('rentalDuration')?.errors?.['required']) {
        errors.rentalDuration = 'Rental duration is required';
      // eslint-disable-next-line dot-notation
      } else if (form.get('rentalDuration')?.errors?.['min']) {
        errors.rentalDuration = 'Rental duration must be at least 1 day';
      }
    }

    if (
      form.get('pickupLocation')?.invalid &&
      form.get('pickupLocation')?.touched
    ) {
      errors.pickupLocation = 'Pickup location is required';
    }

    // Update form errors signal
    this.formErrors.set(errors);
  }

  /**
   * Mark all form controls as touched to trigger validation
   */
  private markFormGroupTouched(formGroup: FormGroup): void {
    Object.values(formGroup.controls).forEach(control => {
      control.markAsTouched();

      if ((control as any).controls) {
        this.markFormGroupTouched(control as FormGroup);
      }
    });

    // Update validation errors
    this.validateForm();
  }
}
