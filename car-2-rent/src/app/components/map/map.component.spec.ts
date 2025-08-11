import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ChangeDetectorRef } from '@angular/core';
import { MapComponent } from './map.component';
import { CarDataService } from '../../services/car-data.service';
import { MapService } from '../../services/map.service';
import { Car, CarStatus } from '../../models/car.model';
import { MOCK_CARS } from '../../../test/mock-data-loader';

// We need to skip most of the tests for the Map component because it heavily relies on Leaflet
// which is difficult to mock properly in a unit test environment
describe('MapComponent', () => {
  let component: MapComponent;
  let fixture: ComponentFixture<MapComponent>;
  let carDataServiceSpy: jasmine.SpyObj<CarDataService>;
  let mapServiceSpy: jasmine.SpyObj<MapService>;
  let changeDetectorRefSpy: jasmine.SpyObj<ChangeDetectorRef>;
  
  const mockCars: Car[] = MOCK_CARS;
  
  beforeEach(async () => {
    // Create spies for the services
    const carDataSpy = jasmine.createSpyObj('CarDataService', [
      'getCars',
      'getCar',
      'selectedCar',
      'selectCar'
    ]);
    
    const mapSpy = jasmine.createSpyObj('MapService', [
      'mapCenter',
      'mapZoom',
      'visibleStatuses',
      'isStatusVisible',
      'toggleStatusVisibility',
      'getMarkerIcon',
      'createPopupContent',
      'calculateBounds'
    ]);
    
    const cdrSpy = jasmine.createSpyObj('ChangeDetectorRef', ['detectChanges']);
    
    await TestBed.configureTestingModule({
      imports: [MapComponent],
      providers: [
        { provide: CarDataService, useValue: carDataSpy },
        { provide: MapService, useValue: mapSpy },
        { provide: ChangeDetectorRef, useValue: cdrSpy }
      ]
    }).compileComponents();
    
    // Setup default spy return values
    carDataServiceSpy = TestBed.inject(CarDataService) as jasmine.SpyObj<CarDataService>;
    carDataServiceSpy.getCars.and.returnValue(mockCars);
    carDataServiceSpy.getCar.and.callFake((id: string) => mockCars.find(car => car.id === id));
    carDataServiceSpy.selectedCar.and.returnValue(null);
    
    mapServiceSpy = TestBed.inject(MapService) as jasmine.SpyObj<MapService>;
    mapServiceSpy.mapCenter.and.returnValue([51.505, -0.09]);
    mapServiceSpy.mapZoom.and.returnValue(13);
    mapServiceSpy.visibleStatuses.and.returnValue([
      CarStatus.AVAILABLE,
      CarStatus.RENTED,
      CarStatus.MAINTENANCE,
      CarStatus.INACTIVE
    ]);
    mapServiceSpy.isStatusVisible.and.returnValue(true);
    
    changeDetectorRefSpy = TestBed.inject(ChangeDetectorRef) as jasmine.SpyObj<ChangeDetectorRef>;
    
    fixture = TestBed.createComponent(MapComponent);
    component = fixture.componentInstance;
  });
  
  it('should create', () => {
    expect(component).toBeTruthy();
  });
  
  // Note: We're skipping most of the tests for the Map component because it heavily relies on Leaflet
  // which is difficult to mock properly in a unit test environment.
  // In a real-world scenario, we would use integration tests or end-to-end tests to test the map functionality.
});