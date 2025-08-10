import { Component, inject, signal, computed, input, output, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  ReactiveFormsModule,
  FormBuilder,
  Validators,
  FormControl,
  FormsModule
} from '@angular/forms';
import {
  FormArray,
  FormGroup,
  FormRecord,
  NonNullableFormBuilder,
  FormControl as AngularFormControl
} from '@angular/forms';
import { DragDropModule, CdkDrag, CdkDragHandle } from '@angular/cdk/drag-drop';
import { Car } from '../../models/car.model';
import { RegistrationService } from '../../services/registration.service';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

@Component({
  selector: 'app-registration',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule, DragDropModule, CdkDrag, CdkDragHandle],
  templateUrl: './registration.component.html',
  styleUrls: ['./registration.component.scss']
})
export class RegistrationComponent {
  // Panel state using signals
  isMinimized = signal(false);
  isDraggable = signal(true);

  // Selected car using signal input
  selectedCar = input<Car | null>(null);

  // Computed signal to check if a car is selected
  hasSelectedCar = computed(() => !!this.selectedCar());

  // Events using output
  close = output<void>();

  // Form controls using signal-based approach
  name = new FormControl('', {
    nonNullable: true,
    validators: [Validators.required]
  });

  email = new FormControl('', {
    nonNullable: true,
    validators: [Validators.required, Validators.email]
  });

  phone = new FormControl('', {
    nonNullable: true
  });

  // Form group using the new controls
  registrationForm = new FormGroup({
    name: this.name,
    email: this.email,
    phone: this.phone
  });

  // Form errors using signals
  formErrors = signal({
    name: '',
    email: ''
  });

  // Computed signals for form state
  isFormValid = computed(() => this.registrationForm.valid);

  // Submission state
  isSubmitting = signal(false);
  submissionSuccess = signal(false);
  submissionError = signal<string | null>(null);

  // Services
  private registrationService = inject(RegistrationService);

  constructor() {
    // Use effect to handle selected car changes
    effect(() => {
      const car = this.selectedCar();
      if (car && this.isMinimized()) {
        this.isMinimized.set(false);
      }
    });

    // Use effect for form validation
    effect(() => {
      // This effect will run whenever form values change
      const nameValue = this.name.value;
      const emailValue = this.email.value;

      // Validate the form
      this.validateForm();
    });
  }

  /**
   * Toggle minimized state
   */
  toggleMinimize(): void {
    this.isMinimized.update(value => !value);
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
    if (this.isFormValid() && this.selectedCar()) {
      this.isSubmitting.set(true);
      this.submissionError.set(null);

      const userData = {
        name: this.name.value,
        email: this.email.value,
        phone: this.phone.value,
        registeredCars: [this.selectedCar()!.id]
      };

      // Use takeUntilDestroyed to automatically unsubscribe
      this.registrationService.registerUser(userData)
        .pipe(takeUntilDestroyed())
        .subscribe({
          next: () => {
            this.isSubmitting.set(false);
            this.submissionSuccess.set(true);

            // Reset form after successful submission
            setTimeout(() => {
              this.resetForm();
            }, 2000);
          },
          error: (error) => {
            this.isSubmitting.set(false);
            this.submissionError.set(error.message || 'Failed to register user');
          }
        });
    } else {
      // Mark all fields as touched to trigger validation
      this.name.markAsTouched();
      this.email.markAsTouched();
      this.phone.markAsTouched();

      // Update validation errors
      this.validateForm();
    }
  }

  /**
   * Reset the form and state
   */
  private resetForm(): void {
    this.name.reset('');
    this.email.reset('');
    this.phone.reset('');

    this.submissionSuccess.set(false);
    this.submissionError.set(null);

    // Clear validation errors
    this.formErrors.set({
      name: '',
      email: ''
    });
  }

  /**
   * Validate the form and update error messages
   */
  private validateForm(): void {
    const errors = { ...this.formErrors() };

    // Clear previous errors
    errors.name = '';
    errors.email = '';

    // Check for validation errors
    if (this.name.invalid && this.name.touched) {
      errors.name = 'Name is required';
    }

    if (this.email.invalid && this.email.touched) {
      if (this.email.hasError('required')) {
        errors.email = 'Email is required';
      } else if (this.email.hasError('email')) {
        errors.email = 'Please enter a valid email address';
      }
    }

    // Update form errors signal
    this.formErrors.set(errors);
  }
}
