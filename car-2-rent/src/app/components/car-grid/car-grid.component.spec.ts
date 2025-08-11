import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { ChangeDetectorRef } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AgGridModule } from 'ag-grid-angular';
import { GridApi, GridReadyEvent, RowSelectedEvent, CellClickedEvent } from 'ag-grid-community';

import { CarGridComponent } from './car-grid.component';
import { CarDataService } from '../../services/car-data.service';
import { Car, CarStatus } from '../../models/car.model';
import { MOCK_CARS } from '../../../test/mock-data-loader';

describe('CarGridComponent', () => {
  let component: CarGridComponent;
  let fixture: ComponentFixture<CarGridComponent>;
  let carDataServiceSpy: jasmine.SpyObj<CarDataService>;
  let changeDetectorRefSpy: jasmine.SpyObj<ChangeDetectorRef>;
  
  const mockCars: Car[] = MOCK_CARS;
  
  // Mock GridApi
  const mockGridApi = {
    setRowData: jasmine.createSpy('setRowData'),
    sizeColumnsToFit: jasmine.createSpy('sizeColumnsToFit'),
    deselectAll: jasmine.createSpy('deselectAll'),
    forEachNode: jasmine.createSpy('forEachNode'),
    refreshCells: jasmine.createSpy('refreshCells'),
    ensureNodeVisible: jasmine.createSpy('ensureNodeVisible')
  } as unknown as GridApi;
  
  beforeEach(async () => {
    // Create spies for the services
    const carDataSpy = jasmine.createSpyObj('CarDataService', [
      'getCars',
      'selectedCar',
      'selectCar'
    ]);
    
    const cdrSpy = jasmine.createSpyObj('ChangeDetectorRef', ['detectChanges']);
    
    await TestBed.configureTestingModule({
      imports: [
        FormsModule,
        AgGridModule,
        CarGridComponent
      ],
      providers: [
        { provide: CarDataService, useValue: carDataSpy },
        { provide: ChangeDetectorRef, useValue: cdrSpy }
      ]
    }).compileComponents();
    
    // Setup default spy return values
    carDataServiceSpy = TestBed.inject(CarDataService) as jasmine.SpyObj<CarDataService>;
    carDataServiceSpy.getCars.and.returnValue(mockCars);
    carDataServiceSpy.selectedCar.and.returnValue(null);
    
    changeDetectorRefSpy = TestBed.inject(ChangeDetectorRef) as jasmine.SpyObj<ChangeDetectorRef>;
    
    fixture = TestBed.createComponent(CarGridComponent);
    component = fixture.componentInstance;
    
    // Set the gridApi
    component['gridApi'] = mockGridApi;
    
    fixture.detectChanges();
  });
  
  it('should create', () => {
    expect(component).toBeTruthy();
  });
  
  it('should initialize with cars from service', () => {
    expect(component.cars()).toEqual(mockCars);
    expect(carDataServiceSpy.getCars).toHaveBeenCalled();
  });
  
  it('should handle grid ready event', () => {
    // Create a mock grid ready event
    const mockEvent = {
      api: mockGridApi
    } as GridReadyEvent;
    
    // Call the onGridReady method
    component.onGridReady(mockEvent);
    
    // Check that the gridApi was set
    expect(component['gridApi']).toBe(mockGridApi);
    
    // Check that sizeColumnsToFit was called
    expect(mockGridApi.sizeColumnsToFit).toHaveBeenCalled();
  });
  
  it('should handle row selection', () => {
    // Create a mock row selected event
    const mockEvent = {
      node: {
        isSelected: () => true
      },
      data: mockCars[0]
    } as unknown as RowSelectedEvent;
    
    // Call the onRowSelected method
    component.onRowSelected(mockEvent);
    
    // Check that selectCar was called with the correct car ID
    expect(carDataServiceSpy.selectCar).toHaveBeenCalledWith(mockCars[0].id);
  });
  
  it('should handle cell click', () => {
    // Create a mock cell clicked event
    const mockEvent = {
      data: mockCars[0]
    } as CellClickedEvent;
    
    // Call the onCellClicked method
    component.onCellClicked(mockEvent);
    
    // Check that selectCar was called with the correct car ID
    expect(carDataServiceSpy.selectCar).toHaveBeenCalledWith(mockCars[0].id);
  });
  
  it('should handle search', () => {
    // Create a mock input event
    const mockEvent = {
      target: {
        value: mockCars[0].name.substring(0, 3).toLowerCase()
      }
    } as unknown as Event;
    
    // Setup spy for the search method
    spyOn(component, 'onSearch').and.callThrough();
    
    // Get the search input element
    const searchInput = fixture.debugElement.query(By.css('input[type="text"]'));
    
    // Trigger the input event
    searchInput.triggerEventHandler('input', mockEvent);
    
    // Check that onSearch was called
    expect(component.onSearch).toHaveBeenCalled();
    
    // Check that the cars were filtered
    expect(component.cars().length).toBeLessThan(mockCars.length);
    
    // Check that the grid was updated
    expect(mockGridApi.setRowData).toHaveBeenCalled();
  });
  
  it('should handle clearing search', () => {
    // Create a mock input event with empty value
    const mockEvent = {
      target: {
        value: ''
      }
    } as unknown as Event;
    
    // Call the onSearch method
    component.onSearch(mockEvent);
    
    // Check that the cars were reset to all cars
    expect(component.cars()).toEqual(mockCars);
    
    // Check that the grid was updated
    expect(mockGridApi.setRowData).toHaveBeenCalledWith(mockCars);
  });
  
  it('should toggle grid view', () => {
    // Setup spy for the toggleGrid event
    spyOn(component.toggleGrid, 'emit');
    
    // Get the initial collapsed state
    const initialCollapsedState = component.isCollapsed();
    
    // Call the toggleGridView method
    component.toggleGridView();
    
    // Check that the collapsed state was toggled
    expect(component.isCollapsed()).toBe(!initialCollapsedState);
    
    // Check that the toggleGrid event was emitted
    expect(component.toggleGrid.emit).toHaveBeenCalled();
    
    // Fast-forward the setTimeout
    jasmine.clock().install();
    jasmine.clock().tick(300);
    
    // Check that sizeColumnsToFit was called
    expect(mockGridApi.sizeColumnsToFit).toHaveBeenCalled();
    
    jasmine.clock().uninstall();
  });
  
  it('should highlight selected car when car is selected from service', () => {
    // Setup spy for the highlightSelectedRow method
    spyOn<any>(component, 'highlightSelectedRow');
    
    // Setup selected car
    const selectedCar = mockCars[0];
    carDataServiceSpy.selectedCar.and.returnValue(selectedCar);
    
    // Trigger the effect by calling selectedCar
    carDataServiceSpy.selectedCar();
    
    // Check that the car was highlighted
    expect(component.selectedCarId()).toBe(selectedCar.id);
    expect(component['highlightSelectedRow']).toHaveBeenCalledWith(selectedCar.id);
  });
  
  it('should clear row selection when no car is selected from service', () => {
    // Setup spy for the clearRowSelection method
    spyOn<any>(component, 'clearRowSelection');
    
    // Setup no selected car
    carDataServiceSpy.selectedCar.and.returnValue(null);
    
    // Trigger the effect by calling selectedCar
    carDataServiceSpy.selectedCar();
    
    // Check that the row selection was cleared
    expect(component.selectedCarId()).toBeNull();
    expect(component['clearRowSelection']).toHaveBeenCalled();
  });
  
  it('should update grid when car data changes', () => {
    // Setup new cars
    const newCars = mockCars.slice(0, 5);
    carDataServiceSpy.getCars.and.returnValue(newCars);
    
    // Trigger the effect by calling getCars
    carDataServiceSpy.getCars();
    
    // Check that the cars were updated
    expect(component.cars()).toEqual(newCars);
    
    // Check that the grid was updated
    expect(mockGridApi.setRowData).toHaveBeenCalledWith(newCars);
    
    // Check that change detection was triggered
    expect(changeDetectorRefSpy.detectChanges).toHaveBeenCalled();
  });
  
  it('should get selected class for selected car', () => {
    // Set the selected car ID
    component['selectedCarId'].set(mockCars[0].id);
    
    // Check that the selected class is returned for the selected car
    expect(component['getSelectedClass'](mockCars[0].id)).toBe('selected-row');
    
    // Check that no class is returned for other cars
    expect(component['getSelectedClass'](mockCars[1].id)).toBe('');
  });
});