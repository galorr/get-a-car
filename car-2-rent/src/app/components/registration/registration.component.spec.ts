import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { By } from '@angular/platform-browser';
import { ChangeDetectionStrategy } from '@angular/core';
import { signal } from '@angular/core';
import { RegistrationComponent } from './registration.component';
import { RegistrationService } from '../../services/registration.service';
import { CarDataService } from '../../services/car-data.service';
import { User } from '../../models/user.model';
import { Car, CarStatus } from '../../models/car.model';

describe('RegistrationComponent', () => {
  let component: RegistrationComponent;
  let fixture: ComponentFixture<RegistrationComponent>;
  let registrationServiceMock: any;
  let carDataServiceMock: any;

  // Mock data
  const mockCar: Car = {
    id: 'car123',
    name: 'Test Car',
    status: CarStatus.AVAILABLE,
    latitude: 32.0853,
    longitude: 34.7818,
    lastUpdated: new Date(),
    model: 'Test Model',
    licensePlate: 'ABC-123'
  };

  const mockUser: User = {
    id: 'user123',
    name: 'Test User',
    email: 'test@example.com',
    phone: '123-456-7890',
    registeredCars: ['car123']
  };

  beforeEach(async () => {
    // Create mock services
    // Create mock services with Jest
    registrationServiceMock = {
      registerUser: jest.fn(),
      registerCarToUser: jest.fn(),
      unregisterCarFromUser: jest.fn(),
      isCarRegisteredToCurrentUser: jest.fn(),
      registerUserInApi: jest.fn().mockReturnValue({
        subscribe: jest.fn(({ next }) => next({ id: 'user123' }))
      }),
      registerCarToUserInApi: jest.fn().mockReturnValue({
        subscribe: jest.fn(({ next }) => next())
      }),
      unregisterCarFromUserInApi: jest.fn().mockReturnValue({
        subscribe: jest.fn(({ next }) => next())
      }),
      setCurrentUser: jest.fn(),
      currentUser: signal(null)
    };

    carDataServiceMock = {
      selectCar: jest.fn(),
      getCar: jest.fn(),
      selectedCar: signal(null)
    };

    await TestBed.configureTestingModule({
      imports: [
        FormsModule,
        ReactiveFormsModule,
        RegistrationComponent
      ],
      providers: [
        { provide: RegistrationService, useValue: registrationServiceMock },
        { provide: CarDataService, useValue: carDataServiceMock }
      ]
    })
    // Use Default change detection for testing
    .overrideComponent(RegistrationComponent, {
      set: { changeDetection: ChangeDetectionStrategy.Default }
    })
    .compileComponents();

    fixture = TestBed.createComponent(RegistrationComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize with default values', () => {
    expect(component.isMinimized()).toBe(false);
    expect(component.position()).toEqual({ x: 20, y: 20 });
    expect(component.isDragging()).toBe(false);
    expect(component.dragOffset()).toEqual({ x: 0, y: 0 });
    expect(component.selectedCar()).toBeNull();
    expect(component.currentUser()).toBeNull();
    expect(component.formErrors()).toEqual({});
  });

  it('should toggle minimized state', () => {
    const initialState = component.isMinimized();
    component.toggleMinimize();
    expect(component.isMinimized()).toBe(!initialState);
    component.toggleMinimize();
    expect(component.isMinimized()).toBe(initialState);
  });

  it('should validate form correctly', () => {
    // Empty form should be invalid
    component.newUser = {
      id: '',
      name: '',
      email: '',
      phone: '',
      registeredCars: []
    };
    expect(component.validateForm()).toBe(false);
    expect(component.formErrors().name).toBeTruthy();
    expect(component.formErrors().email).toBeTruthy();

    // Invalid email should be invalid
    component.newUser = {
      id: '',
      name: 'Test User',
      email: 'invalid-email',
      phone: '',
      registeredCars: []
    };
    expect(component.validateForm()).toBe(false);
    expect(component.formErrors().name).toBeFalsy();
    expect(component.formErrors().email).toBeTruthy();

    // Valid form should be valid
    component.newUser = {
      id: '',
      name: 'Test User',
      email: 'test@example.com',
      phone: '',
      registeredCars: []
    };
    expect(component.validateForm()).toBe(true);
    expect(component.formErrors().name).toBeFalsy();
    expect(component.formErrors().email).toBeFalsy();
  });

  it('should register a user', () => {
    // Setup valid user data
    component.newUser = {
      id: '',
      name: 'Test User',
      email: 'test@example.com',
      phone: '123-456-7890',
      registeredCars: []
    };

    // Register user
    component.registerUser();

    // Should call service
    expect(registrationServiceMock.registerUserInApi).toHaveBeenCalled();

    // Should reset form
    expect(component.newUser.name).toBe('');
    expect(component.newUser.email).toBe('');
    expect(component.newUser.phone).toBe('');

    // Should clear errors
    expect(component.formErrors()).toEqual({});
  });

  it('should not register a user with invalid data', () => {
    // Setup invalid user data
    component.newUser = {
      id: '',
      name: '',
      email: '',
      phone: '',
      registeredCars: []
    };

    // Try to register user
    component.registerUser();

    // Should not call service
    expect(registrationServiceMock.registerUser).not.toHaveBeenCalled();

    // Should have errors
    expect(component.formErrors().name).toBeTruthy();
    expect(component.formErrors().email).toBeTruthy();
  });

  it('should register a car to current user', () => {
    // Setup mock data
    (registrationServiceMock.currentUser as any).set(mockUser);
    (carDataServiceMock.selectedCar as any).set(mockCar);
    fixture.detectChanges();

    // Register car
    component.registerCarToCurrentUser();

    // Should call service
    expect(registrationServiceMock.registerCarToUserInApi).toHaveBeenCalledWith(mockUser.id, mockCar.id);
  });

  it('should unregister a car from current user', () => {
    // Setup mock data
    (registrationServiceMock.currentUser as any).set(mockUser);
    fixture.detectChanges();

    // Unregister car
    component.unregisterCar('car123');

    // Should call service
    expect(registrationServiceMock.unregisterCarFromUserInApi).toHaveBeenCalledWith(mockUser.id, 'car123');
  });

  it('should check if car is registered to current user', () => {
    // Setup mock
    registrationServiceMock.isCarRegisteredToCurrentUser.mockReturnValue(true);

    // Check if car is registered
    const result = component.isCarRegistered('car123');

    // Should call service and return result
    expect(registrationServiceMock.isCarRegisteredToCurrentUser).toHaveBeenCalledWith('car123');
    expect(result).toBe(true);
  });

  it('should get car by ID', () => {
    // Setup mock
    carDataServiceMock.getCar.mockReturnValue(mockCar);

    // Get car
    const result = component.getCarById('car123');

    // Should call service and return result
    expect(carDataServiceMock.getCar).toHaveBeenCalledWith('car123');
    expect(result).toBe(mockCar);
  });

  it('should select a car', () => {
    // Select car
    component.selectCar('car123');

    // Should call service
    expect(carDataServiceMock.selectCar).toHaveBeenCalledWith('car123');
  });

  it('should get status class', () => {
    expect(component.getStatusClass(CarStatus.AVAILABLE)).toBe(CarStatus.AVAILABLE);
    expect(component.getStatusClass(CarStatus.RENTED)).toBe(CarStatus.RENTED);
    expect(component.getStatusClass(CarStatus.MAINTENANCE)).toBe(CarStatus.MAINTENANCE);
    expect(component.getStatusClass(undefined)).toBe('');
  });

  it('should start drag on panel header', () => {
    // Create a real DOM element for testing
    const headerDiv = document.createElement('div');
    headerDiv.classList.add('panel-header');

    // Create a parent element to act as currentTarget
    const panelDiv = document.createElement('div');
    panelDiv.appendChild(headerDiv);

    // Mock getBoundingClientRect on the panel
    jest.spyOn(panelDiv, 'getBoundingClientRect').mockReturnValue({
      left: 50,
      top: 50,
      right: 350,
      bottom: 450,
      width: 300,
      height: 400,
      x: 50,
      y: 50,
      toJSON: () => {}
    });

    // Add event listener spies
    jest.spyOn(document, 'addEventListener');

    // Create a more realistic MouseEvent
    const mouseEvent = new MouseEvent('mousedown', {
      bubbles: true,
      cancelable: true,
      clientX: 100,
      clientY: 100
    });

    // Override target and currentTarget properties
    Object.defineProperty(mouseEvent, 'target', { value: headerDiv });
    Object.defineProperty(mouseEvent, 'currentTarget', { value: panelDiv });

    // Start drag
    component.startDrag(mouseEvent);

    // Should set dragging state
    expect(component.isDragging()).toBe(true);

    // Should set drag offset
    expect(component.dragOffset()).toEqual({ x: 50, y: 50 });

    // Should add event listeners
    expect(document.addEventListener).toHaveBeenCalledWith('mousemove', expect.any(Function));
    expect(document.addEventListener).toHaveBeenCalledWith('mouseup', expect.any(Function));
  });

  it('should not start drag on non-header elements', () => {
    // Create a real DOM element for testing (not a header)
    const nonHeaderDiv = document.createElement('div');

    // Create a parent element to act as currentTarget
    const panelDiv = document.createElement('div');
    panelDiv.appendChild(nonHeaderDiv);

    // Reset any previous calls to addEventListener
    jest.spyOn(document, 'addEventListener').mockClear();

    // Create a more realistic MouseEvent
    const mouseEvent = new MouseEvent('mousedown', {
      bubbles: true,
      cancelable: true
    });

    // Override target and currentTarget properties
    Object.defineProperty(mouseEvent, 'target', { value: nonHeaderDiv });
    Object.defineProperty(mouseEvent, 'currentTarget', { value: panelDiv });

    // Start drag
    component.startDrag(mouseEvent);

    // Should not set dragging state
    expect(component.isDragging()).toBe(false);

    // Should not add event listeners
    expect(document.addEventListener).not.toHaveBeenCalled();
  });

  // DOM Tests
  it('should render registration form when no user is logged in', () => {
    // Ensure no user is set
    (registrationServiceMock.currentUser as any).set(null);
    fixture.detectChanges();

    // Should show registration form
    const form = fixture.debugElement.query(By.css('.registration-form'));
    expect(form).toBeTruthy();

    // Should have name, email, and phone inputs
    expect(fixture.debugElement.query(By.css('#name'))).toBeTruthy();
    expect(fixture.debugElement.query(By.css('#email'))).toBeTruthy();
    expect(fixture.debugElement.query(By.css('#phone'))).toBeTruthy();

    // Should have register button
    expect(fixture.debugElement.query(By.css('.register-button'))).toBeTruthy();
  });

  it('should render user info when user is logged in', () => {
    // Set current user
    (registrationServiceMock.currentUser as any).set(mockUser);
    fixture.detectChanges();

    // Should show user info
    const userInfo = fixture.debugElement.query(By.css('.user-info'));
    expect(userInfo).toBeTruthy();

    // Should show user name and email
    expect(userInfo.nativeElement.textContent).toContain(mockUser.name);
    expect(userInfo.nativeElement.textContent).toContain(mockUser.email);

    // Should show registered cars section
    expect(fixture.debugElement.query(By.css('.registered-cars'))).toBeTruthy();
  });

  it('should render selected car info when car is selected', () => {
    // Set current user and selected car
    (registrationServiceMock.currentUser as any).set(mockUser);
    (carDataServiceMock.selectedCar as any).set(mockCar);
    fixture.detectChanges();

    // Should show selected car section
    const selectedCar = fixture.debugElement.query(By.css('.selected-car'));
    expect(selectedCar).toBeTruthy();

    // Should show car details
    expect(selectedCar.nativeElement.textContent).toContain(mockCar.name);
    expect(selectedCar.nativeElement.textContent).toContain(mockCar.id);
    expect(selectedCar.nativeElement.textContent).toContain(mockCar.model);
    expect(selectedCar.nativeElement.textContent).toContain(mockCar.licensePlate);
  });

  it('should show register car button when car is not registered', () => {
    // Set current user and selected car
    (registrationServiceMock.currentUser as any).set(mockUser);
    (carDataServiceMock.selectedCar as any).set(mockCar);
    registrationServiceMock.isCarRegisteredToCurrentUser.mockReturnValue(false);
    fixture.detectChanges();

    // Should show register button
    const registerButton = fixture.debugElement.query(By.css('.selected-car .register-button'));
    expect(registerButton).toBeTruthy();

    // Should not show already registered message
    expect(fixture.debugElement.query(By.css('.registered-message'))).toBeFalsy();
  });

  it('should show already registered message when car is registered', () => {
    // Set current user and selected car
    (registrationServiceMock.currentUser as any).set(mockUser);
    (carDataServiceMock.selectedCar as any).set(mockCar);
    registrationServiceMock.isCarRegisteredToCurrentUser.mockReturnValue(true);
    fixture.detectChanges();

    // Should not show register button
    expect(fixture.debugElement.query(By.css('.selected-car .register-button'))).toBeFalsy();

    // Should show already registered message
    const message = fixture.debugElement.query(By.css('.registered-message'));
    expect(message).toBeTruthy();
    expect(message.nativeElement.textContent).toContain('already registered');
  });

  it('should render registered cars list', () => {
    // Setup mocks
    (registrationServiceMock.currentUser as any).set(mockUser);
    carDataServiceMock.getCar.mockReturnValue(mockCar);
    fixture.detectChanges();

    // Should show car list
    const carList = fixture.debugElement.query(By.css('.car-list'));
    expect(carList).toBeTruthy();

    // Should have one car item
    const carItems = fixture.debugElement.queryAll(By.css('.car-list li'));
    expect(carItems.length).toBe(1);

    // Should show car name
    expect(carItems[0].nativeElement.textContent).toContain(mockCar.name);

    // Should have unregister button
    expect(carItems[0].query(By.css('.unregister-button'))).toBeTruthy();
  });

  it('should show no cars message when user has no registered cars', () => {
    // Setup user with no cars
    const userWithNoCars = { ...mockUser, registeredCars: [] };
    (registrationServiceMock.currentUser as any).set(userWithNoCars);
    fixture.detectChanges();

    // Should show no cars message
    const noCarsMessage = fixture.debugElement.query(By.css('.no-cars'));
    expect(noCarsMessage).toBeTruthy();
    expect(noCarsMessage.nativeElement.textContent).toContain('No cars registered');

    // Should not show car list
    expect(fixture.debugElement.query(By.css('.car-list'))).toBeFalsy();
  });

  it('should handle click on register button', () => {
    // Setup form
    component.newUser = {
      id: '',
      name: 'Test User',
      email: 'test@example.com',
      phone: '',
      registeredCars: []
    };
    fixture.detectChanges();

    // Spy on registerUser method
    jest.spyOn(component, 'registerUser');

    // Click register button
    const registerButton = fixture.debugElement.query(By.css('.register-button'));
    registerButton.triggerEventHandler('click', null);

    // Should call registerUser
    expect(component.registerUser).toHaveBeenCalled();
  });

  it('should handle click on register car button', () => {
    // Setup mocks
    (registrationServiceMock.currentUser as any).set(mockUser);
    (carDataServiceMock.selectedCar as any).set(mockCar);
    registrationServiceMock.isCarRegisteredToCurrentUser.mockReturnValue(false);
    fixture.detectChanges();

    // Spy on registerCarToCurrentUser method
    jest.spyOn(component, 'registerCarToCurrentUser');

    // Click register car button
    const registerButton = fixture.debugElement.query(By.css('.selected-car .register-button'));
    registerButton.triggerEventHandler('click', null);

    // Should call registerCarToCurrentUser
    expect(component.registerCarToCurrentUser).toHaveBeenCalled();
  });

  it('should handle click on unregister button', () => {
    // Setup mocks
    (registrationServiceMock.currentUser as any).set(mockUser);
    carDataServiceMock.getCar.mockReturnValue(mockCar);
    fixture.detectChanges();

    // Spy on unregisterCar method
    jest.spyOn(component, 'unregisterCar');

    // Create mock event
    const mockEvent = { stopPropagation: jest.fn() };

    // Get unregister button
    const unregisterButton = fixture.debugElement.query(By.css('.unregister-button'));

    // Trigger click with mock event
    unregisterButton.triggerEventHandler('click', mockEvent);

    // Should call unregisterCar with car ID
    expect(component.unregisterCar).toHaveBeenCalledWith('car123');

    // Should stop propagation
    expect(mockEvent.stopPropagation).toHaveBeenCalled();
  });

  it('should handle click on car in registered cars list', () => {
    // Setup mocks
    (registrationServiceMock.currentUser as any).set(mockUser);
    carDataServiceMock.getCar.mockReturnValue(mockCar);
    fixture.detectChanges();

    // Spy on selectCar method
    jest.spyOn(component, 'selectCar');

    // Click on car item
    const carItem = fixture.debugElement.query(By.css('.car-list li'));
    carItem.triggerEventHandler('click', null);

    // Should call selectCar with car ID
    expect(component.selectCar).toHaveBeenCalledWith('car123');
  });

  it('should handle click on minimize button', () => {
    // Spy on toggleMinimize method
    jest.spyOn(component, 'toggleMinimize');

    // Click minimize button
    const minimizeButton = fixture.debugElement.query(By.css('.minimize-button'));
    minimizeButton.triggerEventHandler('click', null);

    // Should call toggleMinimize
    expect(component.toggleMinimize).toHaveBeenCalled();
  });

  it('should update button text based on minimized state', () => {
    // Initially expanded
    component.isMinimized.set(false);
    fixture.detectChanges();

    // Button should say "Minimize"
    let minimizeButton = fixture.debugElement.query(By.css('.minimize-button'));
    expect(minimizeButton.nativeElement.textContent.trim()).toBe('Minimize');

    // Set to minimized
    component.isMinimized.set(true);
    fixture.detectChanges();

    // Button should say "Expand"
    minimizeButton = fixture.debugElement.query(By.css('.minimize-button'));
    expect(minimizeButton.nativeElement.textContent.trim()).toBe('Expand');
  });

  it('should auto-expand when a car is selected while minimized', () => {
    // Set to minimized
    component.isMinimized.set(true);
    fixture.detectChanges();

    // Select a car
    (carDataServiceMock.selectedCar as any).set(mockCar);
    fixture.detectChanges();

    // Should auto-expand
    expect(component.isMinimized()).toBe(false);
  });

  it('should show form validation errors', () => {
    // Submit empty form
    component.validateForm();
    fixture.detectChanges();

    // Should show error messages
    const nameError = fixture.debugElement.query(By.css('.error-message'));
    expect(nameError).toBeTruthy();
    expect(nameError.nativeElement.textContent).toContain('required');

    // Should add error class to inputs
    const nameInput = fixture.debugElement.query(By.css('#name'));
    expect(nameInput.classes['error']).toBe(true);
  });

  it('should position panel according to position signal', () => {
    // Set position
    component.position.set({ x: 100, y: 150 });
    fixture.detectChanges();

    // Panel should have correct position
    const panel = fixture.debugElement.query(By.css('.registration-panel'));

    // Check inline styles instead of styles property
    const leftStyle = panel.nativeElement.style.left;
    const topStyle = panel.nativeElement.style.top;

    expect(leftStyle).toBe('100px');
    expect(topStyle).toBe('150px');
  });

  it('should add minimized class when minimized', () => {
    // Set to minimized
    component.isMinimized.set(true);
    fixture.detectChanges();

    // Panel should have minimized class
    const panel = fixture.debugElement.query(By.css('.registration-panel'));
    expect(panel.classes['minimized']).toBe(true);
  });
});
