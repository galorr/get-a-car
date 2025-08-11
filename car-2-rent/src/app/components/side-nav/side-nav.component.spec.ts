import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { By } from '@angular/platform-browser';
import { ChangeDetectionStrategy } from '@angular/core';
import { signal } from '@angular/core';
import { SideNavComponent } from './side-nav.component';
import { NavigationService } from '../../services/navigation.service';
import { CarDataService } from '../../services/car-data.service';
import { Car, CarStatus } from '../../models/car.model';

describe('SideNavComponent', () => {
  let component: SideNavComponent;
  let fixture: ComponentFixture<SideNavComponent>;
  let navigationServiceMock: jasmine.SpyObj<NavigationService>;
  let carDataServiceMock: jasmine.SpyObj<CarDataService>;
  
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
    navigationServiceMock = jasmine.createSpyObj('NavigationService', [
      'navigateToMap',
      'navigateToCars',
      'navigateToRegistration',
      'navigateToCar'
    ], {
      currentRoute: signal('/map')
    });
    
    carDataServiceMock = jasmine.createSpyObj('CarDataService', [], {
      selectedCar: signal(null)
    });

    await TestBed.configureTestingModule({
      imports: [
        RouterTestingModule,
        SideNavComponent
      ],
      providers: [
        { provide: NavigationService, useValue: navigationServiceMock },
        { provide: CarDataService, useValue: carDataServiceMock }
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

  it('should initialize with correct state based on window width', () => {
    // Mock window.innerWidth
    spyOnProperty(window, 'innerWidth').and.returnValue(1024);
    component.onResize();
    expect(component.isMobile()).toBeFalse();
    expect(component.isCollapsed()).toBeFalse();

    // Test mobile view
    spyOnProperty(window, 'innerWidth').and.returnValue(600);
    component.onResize();
    expect(component.isMobile()).toBeTrue();
    expect(component.isCollapsed()).toBeTrue();
  });

  it('should toggle navigation when toggle button is clicked', () => {
    const initialState = component.isCollapsed();
    const toggleButton = fixture.debugElement.query(By.css('.nav-toggle'));
    
    toggleButton.triggerEventHandler('click', null);
    expect(component.isCollapsed()).toBe(!initialState);
    
    toggleButton.triggerEventHandler('click', null);
    expect(component.isCollapsed()).toBe(initialState);
  });

  it('should navigate to map when map link is clicked', () => {
    const mapLink = fixture.debugElement.query(By.css('.nav-link:nth-child(1)'));
    mapLink.triggerEventHandler('click', null);
    
    expect(navigationServiceMock.navigateToMap).toHaveBeenCalled();
  });

  it('should navigate to cars when car list link is clicked', () => {
    const carsLink = fixture.debugElement.query(By.css('.nav-link:nth-child(2)'));
    carsLink.triggerEventHandler('click', null);
    
    expect(navigationServiceMock.navigateToCars).toHaveBeenCalled();
  });

  it('should navigate to registration when registration link is clicked', () => {
    const registrationLink = fixture.debugElement.query(By.css('.nav-link:nth-child(3)'));
    registrationLink.triggerEventHandler('click', null);
    
    expect(navigationServiceMock.navigateToRegistration).toHaveBeenCalled();
  });

  it('should auto-collapse on mobile after navigation', () => {
    // Set to mobile view
    spyOnProperty(window, 'innerWidth').and.returnValue(600);
    component.onResize();
    component.isCollapsed.set(false);
    
    // Navigate
    component.navigate('/map');
    
    expect(component.isCollapsed()).toBeTrue();
  });

  it('should correctly identify active routes', () => {
    // Set current route to /map
    (navigationServiceMock.currentRoute as any).set('/map');
    expect(component.isRouteActive('/map')).toBeTrue();
    expect(component.isRouteActive('/cars')).toBeFalse();
    
    // Set current route to /cars
    (navigationServiceMock.currentRoute as any).set('/cars');
    expect(component.isRouteActive('/map')).toBeFalse();
    expect(component.isRouteActive('/cars')).toBeTrue();
  });

  it('should display selected car information when a car is selected', () => {
    // Initially no car is selected
    expect(fixture.debugElement.query(By.css('.selected-car'))).toBeNull();
    
    // Select a car
    (carDataServiceMock.selectedCar as any).set(mockCar);
    fixture.detectChanges();
    
    // Car info should be displayed when not collapsed
    component.isCollapsed.set(false);
    fixture.detectChanges();
    
    const carInfo = fixture.debugElement.query(By.css('.selected-car'));
    expect(carInfo).not.toBeNull();
    expect(carInfo.query(By.css('.car-name')).nativeElement.textContent).toContain(mockCar.name);
    expect(carInfo.query(By.css('.car-id')).nativeElement.textContent).toContain(mockCar.id);
    expect(carInfo.query(By.css('.status-badge')).nativeElement.textContent.trim()).toBe(mockCar.status);
  });

  it('should navigate to car when view car button is clicked', () => {
    // Select a car
    (carDataServiceMock.selectedCar as any).set(mockCar);
    component.isCollapsed.set(false);
    fixture.detectChanges();
    
    const viewCarBtn = fixture.debugElement.query(By.css('.view-car-btn'));
    viewCarBtn.triggerEventHandler('click', null);
    
    expect(navigationServiceMock.navigateToCar).toHaveBeenCalledWith(mockCar.id);
  });

  it('should hide car info when collapsed', () => {
    // Select a car
    (carDataServiceMock.selectedCar as any).set(mockCar);
    
    // Collapse the nav
    component.isCollapsed.set(true);
    fixture.detectChanges();
    
    // Car info should be hidden
    expect(fixture.debugElement.query(By.css('.selected-car'))).toBeNull();
  });

  it('should show correct toggle icon based on collapsed state', () => {
    const getToggleIcon = () => 
      fixture.debugElement.query(By.css('.nav-toggle .material-icons')).nativeElement.textContent.trim();
    
    // When collapsed
    component.isCollapsed.set(true);
    fixture.detectChanges();
    expect(getToggleIcon()).toBe('menu');
    
    // When expanded
    component.isCollapsed.set(false);
    fixture.detectChanges();
    expect(getToggleIcon()).toBe('close');
  });
});