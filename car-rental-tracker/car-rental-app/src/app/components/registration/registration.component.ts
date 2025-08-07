import { Component, inject, signal, Input, Output, EventEmitter, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { CdkDrag, CdkDragHandle } from '@angular/cdk/drag-drop';
import { Car } from '../../models/car.model';
import { RegistrationService } from '../../services/registration.service';

@Component({
  selector: 'app-registration',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, CdkDrag, CdkDragHandle],
  templateUrl: './registration.component.html',
  styleUrls: ['./registration.component.scss']
})
export class RegistrationComponent {
  // Panel state
  isMinimized = signal(false);
  isDraggable = signal(true);

  // Selected car
  private _selectedCar: Car | null = null;
  @Input() set selectedCar(car: Car | null) {
    this._selectedCar = car;

    // Expand panel if minimized
    if (car && this.isMinimized()) {
      this.isMinimized.set(false);
    }
  }
  get selectedCar(): Car | null {
    return this._selectedCar;
  }

  // Events
  @Output() close = new EventEmitter<void>();

  // Form
  registrationForm: FormGroup;
  formErrors = {
    name: '',
    email: ''
  };

  // Submission state
  isSubmitting = signal(false);
  submissionSuccess = signal(false);
  submissionError = signal<string | null>(null);

  // Services
  private fb = inject(FormBuilder);
  private registrationService = inject(RegistrationService);
  private cdr = inject(ChangeDetectorRef);

  constructor() {
    // Initialize form
    this.registrationForm = this.fb.group({
      name: ['', [Validators.required]],
      email: ['', [Validators.required, Validators.email]],
      phone: ['']
    });

    // Subscribe to form value changes for validation
    this.registrationForm.valueChanges.subscribe(() => {
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
    if (this.registrationForm.valid && this.selectedCar) {
      this.isSubmitting.set(true);
      this.submissionError.set(null);

      const userData = {
        ...this.registrationForm.value,
        registeredCars: [this.selectedCar.id]
      };

      this.registrationService.registerUser(userData).subscribe({
        next: (response) => {
          this.isSubmitting.set(false);
          this.submissionSuccess.set(true);

          // Reset form after successful submission
          setTimeout(() => {
            this.resetForm();
            this.cdr.detectChanges();
          }, 2000);
        },
        error: (error) => {
          this.isSubmitting.set(false);
          this.submissionError.set(error.message || 'Failed to register user');
          this.cdr.detectChanges();
        }
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
    this.formErrors.name = '';
    this.formErrors.email = '';
  }

  /**
   * Validate the form and update error messages
   */
  private validateForm(): void {
    const form = this.registrationForm;

    // Clear previous errors
    this.formErrors.name = '';
    this.formErrors.email = '';

    // Check for validation errors
    if (form.get('name')?.invalid && form.get('name')?.touched) {
      this.formErrors.name = 'Name is required';
    }

    if (form.get('email')?.invalid && form.get('email')?.touched) {
      if (form.get('email')?.errors?.['required']) {
        this.formErrors.email = 'Email is required';
      } else if (form.get('email')?.errors?.['email']) {
        this.formErrors.email = 'Please enter a valid email address';
      }
    }
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
