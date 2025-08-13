import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { By } from '@angular/platform-browser';
import { ChangeDetectionStrategy } from '@angular/core';
import { signal } from '@angular/core';
import { of, throwError } from 'rxjs';
import { SideNavComponent } from './side-nav.component';
import { RegistrationService } from '../../services/registration.service';
import { Car, CarStatus } from '../../models/car.model';

describe('SideNavComponent', () => {
  let component: SideNavComponent;
  let fixture: ComponentFixture<SideNavComponent>;
  let registrationServiceMock: any;

  const mockCar: Car = {
    id: 'car123',
    name: 'Test Car',
    status: CarStatus.AVAILABLE,
    latitude: 32.0853,
    longitude: 34.7818,
    lastUpdated: new Date()
  };

  beforeEach(async () => {
    // Create mock services
    registrationServiceMock = {
      registerUserInApi: jest.fn().mockReturnValue(of({ success: true }))
    };

    await TestBed.configureTestingModule({
      imports: [
        ReactiveFormsModule,
        SideNavComponent
      ],
      providers: [
        { provide: RegistrationService, useValue: registrationServiceMock }
      ]
    })
    // Use Default change detection for testing
    .overrideComponent(SideNavComponent, {
      set: { changeDetection: ChangeDetectionStrategy.Default }
    })
    .compileComponents();

    fixture = TestBed.createComponent(SideNavComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize with collapsed state', () => {
    expect(component.isExpanded()).toBe(false);
    expect(component.activeSection()).toBe('registration');
  });

  it('should toggle expanded state', () => {
    const initialState = component.isExpanded();
    component.toggleExpand();
    expect(component.isExpanded()).toBe(!initialState);
  });

  it('should set active section and expand', () => {
    component.isExpanded.set(false);
    component.setActiveSection('alerts');

    expect(component.activeSection()).toBe('alerts');
    expect(component.isExpanded()).toBe(true);
  });

  it('should not change section if already active', () => {
    component.activeSection.set('registration');
    component.isExpanded.set(false);

    component.setActiveSection('registration');

    expect(component.activeSection()).toBe('registration');
    expect(component.isExpanded()).toBe(false);
  });

  it('should expand and set registration section when car is selected', () => {
    component.isExpanded.set(false);
    component.activeSection.set('alerts');

    // Set selected car input
    fixture.componentRef.setInput('selectedCar', mockCar);
    fixture.detectChanges();

    expect(component.isExpanded()).toBe(true);
    expect(component.activeSection()).toBe('registration');
  });

  it('should compute hasSelectedCar correctly', () => {
    // No car selected
    fixture.componentRef.setInput('selectedCar', null);
    fixture.detectChanges();
    expect(component.hasSelectedCar()).toBe(false);

    // Car selected
    fixture.componentRef.setInput('selectedCar', mockCar);
    fixture.detectChanges();
    expect(component.hasSelectedCar()).toBe(true);
  });

  it('should validate form correctly', () => {
    // Empty form should be invalid
    component.registrationForm.patchValue({
      name: '',
      email: '',
      address: '',
      license: '',
      preferredCarType: '',
      rentalDuration: '',
      pickupLocation: ''
    });

    // Mark all fields as touched to trigger validation
    Object.keys(component.registrationForm.controls).forEach(key => {
      component.registrationForm.get(key)?.markAsTouched();
    });

    fixture.detectChanges();

    expect(component.registrationForm.valid).toBe(false);
    expect(component.formErrors().name).toBeTruthy();
    expect(component.formErrors().email).toBeTruthy();
  });

  it('should submit form successfully', () => {
    // Set up valid form data
    component.registrationForm.patchValue({
      name: 'Test User',
      email: 'test@example.com',
      phone: '123-456-7890',
      address: '123 Test St',
      license: 'DL12345678',
      preferredCarType: 'economy',
      rentalDuration: 7,
      pickupLocation: 'airport'
    });

    // Set selected car
    fixture.componentRef.setInput('selectedCar', mockCar);
    fixture.detectChanges();

    // Submit form
    component.onSubmit();

    expect(registrationServiceMock.registerUserInApi).toHaveBeenCalledWith({
      name: 'Test User',
      email: 'test@example.com',
      phone: '123-456-7890',
      address: '123 Test St',
      license: 'DL12345678',
      preferredCarType: 'economy',
      rentalDuration: 7,
      pickupLocation: 'airport',
      registeredCars: ['car123']
    });

    expect(component.submissionSuccess()).toBe(true);
    expect(component.isSubmitting()).toBe(false);
  });

  it('should handle form submission error', () => {
    const errorMessage = 'Registration failed';
    registrationServiceMock.registerUserInApi.mockReturnValue(
      throwError(() => new Error(errorMessage))
    );

    // Set up valid form data
    component.registrationForm.patchValue({
      name: 'Test User',
      email: 'test@example.com',
      address: '123 Test St',
      license: 'DL12345678',
      preferredCarType: 'economy',
      rentalDuration: 7,
      pickupLocation: 'airport'
    });

    // Set selected car
    fixture.componentRef.setInput('selectedCar', mockCar);
    fixture.detectChanges();

    // Submit form
    component.onSubmit();

    expect(component.submissionError()).toBe(errorMessage);
    expect(component.isSubmitting()).toBe(false);
  });

  it('should not submit form without selected car', () => {
    // Set up valid form data but no selected car
    component.registrationForm.patchValue({
      name: 'Test User',
      email: 'test@example.com',
      address: '123 Test St',
      license: 'DL12345678',
      preferredCarType: 'economy',
      rentalDuration: 7,
      pickupLocation: 'airport'
    });

    fixture.componentRef.setInput('selectedCar', null);
    fixture.detectChanges();

    // Submit form
    component.onSubmit();

    expect(registrationServiceMock.registerUserInApi).not.toHaveBeenCalled();
  });

  it('should emit close event', () => {
    const closeSpy = jest.fn();
    component.close.subscribe(closeSpy);

    component.closePanel();

    expect(closeSpy).toHaveBeenCalled();
  });

  it('should render registration section when active', () => {
    component.isExpanded.set(true);
    component.activeSection.set('registration');
    fixture.detectChanges();

    const registrationSection = fixture.debugElement.query(By.css('.section h3'));
    expect(registrationSection.nativeElement.textContent).toContain('Car Registration');
  });

  it('should render alerts section when active', () => {
    component.isExpanded.set(true);
    component.activeSection.set('alerts');
    fixture.detectChanges();

    const alertsSection = fixture.debugElement.query(By.css('.section h3'));
    expect(alertsSection.nativeElement.textContent).toContain('Alerts');
  });

  it('should render settings section when active', () => {
    component.isExpanded.set(true);
    component.activeSection.set('settings');
    fixture.detectChanges();

    const settingsSection = fixture.debugElement.query(By.css('.section h3'));
    expect(settingsSection.nativeElement.textContent).toContain('Settings');
  });

  it('should show form when not submitted successfully', () => {
    component.isExpanded.set(true);
    component.activeSection.set('registration');
    component.submissionSuccess.set(false);
    fixture.detectChanges();

    const form = fixture.debugElement.query(By.css('form'));
    expect(form).toBeTruthy();
  });

  it('should show success message when submitted successfully', () => {
    component.isExpanded.set(true);
    component.activeSection.set('registration');
    component.submissionSuccess.set(true);
    fixture.detectChanges();

    const successMessage = fixture.debugElement.query(By.css('.success-message'));
    expect(successMessage).toBeTruthy();
    expect(successMessage.nativeElement.textContent).toContain('Registration successful');
  });

  it('should show error message when submission fails', () => {
    component.isExpanded.set(true);
    component.activeSection.set('registration');
    component.submissionError.set('Test error message');
    fixture.detectChanges();

    const errorMessage = fixture.debugElement.query(By.css('.error-message'));
    expect(errorMessage).toBeTruthy();
    expect(errorMessage.nativeElement.textContent).toContain('Test error message');
  });

  it('should show no car selected message when no car is selected', () => {
    component.isExpanded.set(true);
    component.activeSection.set('registration');
    component.submissionSuccess.set(false);
    fixture.componentRef.setInput('selectedCar', null);
    fixture.detectChanges();

    const noCarMessage = fixture.debugElement.query(By.css('.no-car-selected'));
    expect(noCarMessage).toBeTruthy();
    expect(noCarMessage.nativeElement.textContent).toContain('Please select a car');
  });

  it('should show selected car info when car is selected', () => {
    component.isExpanded.set(true);
    component.activeSection.set('registration');
    component.submissionSuccess.set(false);
    fixture.componentRef.setInput('selectedCar', mockCar);
    fixture.detectChanges();

    const selectedCarInfo = fixture.debugElement.query(By.css('.selected-car-info'));
    expect(selectedCarInfo).toBeTruthy();
    expect(selectedCarInfo.nativeElement.textContent).toContain(mockCar.name);
    expect(selectedCarInfo.nativeElement.textContent).toContain(mockCar.id);
  });

  it('should handle tab clicks', () => {
    component.isExpanded.set(true);
    fixture.detectChanges();

    const alertsTab = fixture.debugElement.queryAll(By.css('.tab'))[1];
    alertsTab.triggerEventHandler('click', null);

    expect(component.activeSection()).toBe('alerts');
  });

  it('should handle toggle button click', () => {
    const initialState = component.isExpanded();

    const toggleButton = fixture.debugElement.query(By.css('.side-nav-toggle'));
    toggleButton.triggerEventHandler('click', null);

    expect(component.isExpanded()).toBe(!initialState);
  });
});
