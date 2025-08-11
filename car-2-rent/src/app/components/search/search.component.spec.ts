import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';
import { By } from '@angular/platform-browser';
import { ChangeDetectionStrategy } from '@angular/core';
import { SearchComponent } from './search.component';
import { CarDataService } from '../../services/car-data.service';
import { MapService } from '../../services/map.service';
import { Car, CarStatus } from '../../models/car.model';

describe('SearchComponent', () => {
  let component: SearchComponent;
  let fixture: ComponentFixture<SearchComponent>;
  let carDataServiceMock: jasmine.SpyObj<CarDataService>;
  let mapServiceMock: jasmine.SpyObj<MapService>;
  
  // Mock cars data
  const mockCars: Car[] = [
    {
      id: 'car1',
      name: 'Toyota Camry',
      status: CarStatus.AVAILABLE,
      latitude: 32.0853,
      longitude: 34.7818,
      lastUpdated: new Date(),
      model: 'Camry',
      licensePlate: 'ABC-123'
    },
    {
      id: 'car2',
      name: 'Honda Civic',
      status: CarStatus.RENTED,
      latitude: 32.0853,
      longitude: 34.7818,
      lastUpdated: new Date(),
      model: 'Civic',
      licensePlate: 'XYZ-789'
    },
    {
      id: 'car3',
      name: 'Tesla Model 3',
      status: CarStatus.MAINTENANCE,
      latitude: 32.0853,
      longitude: 34.7818,
      lastUpdated: new Date(),
      model: 'Model 3'
    }
  ];

  // Mock localStorage
  let localStorageMock: { [key: string]: string } = {};

  beforeEach(async () => {
    // Setup localStorage mock
    localStorageMock = {};
    spyOn(localStorage, 'getItem').and.callFake((key) => localStorageMock[key] || null);
    spyOn(localStorage, 'setItem').and.callFake((key, value) => localStorageMock[key] = value);
    
    // Create mock services
    carDataServiceMock = jasmine.createSpyObj('CarDataService', ['getCars', 'selectCar']);
    mapServiceMock = jasmine.createSpyObj('MapService', ['setMapCenter', 'setMapZoom']);
    
    // Setup mock return values
    carDataServiceMock.getCars.and.returnValue(mockCars);

    await TestBed.configureTestingModule({
      imports: [
        FormsModule,
        SearchComponent
      ],
      providers: [
        { provide: CarDataService, useValue: carDataServiceMock },
        { provide: MapService, useValue: mapServiceMock }
      ]
    })
    // Use Default change detection for testing
    .overrideComponent(SearchComponent, {
      set: { changeDetection: ChangeDetectionStrategy.Default }
    })
    .compileComponents();

    fixture = TestBed.createComponent(SearchComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize with empty search term and results', () => {
    expect(component.searchTerm()).toBe('');
    expect(component.searchResults().length).toBe(0);
    expect(component.isExpanded()).toBeFalse();
  });

  it('should load recent searches from localStorage on init', () => {
    // Setup localStorage with mock data
    const mockSearches = ['Toyota', 'Honda', 'Tesla'];
    localStorageMock['recentSearches'] = JSON.stringify(mockSearches);
    
    // Re-create component to trigger constructor
    fixture = TestBed.createComponent(SearchComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
    
    expect(component.recentSearches()).toEqual(mockSearches);
  });

  it('should handle localStorage errors gracefully', () => {
    // Setup localStorage with invalid JSON
    localStorageMock['recentSearches'] = 'invalid-json';
    
    // Re-create component to trigger constructor
    fixture = TestBed.createComponent(SearchComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
    
    // Should set empty array on error
    expect(component.recentSearches()).toEqual([]);
  });

  it('should toggle expanded state', () => {
    const initialState = component.isExpanded();
    component.toggleExpand();
    expect(component.isExpanded()).toBe(!initialState);
    component.toggleExpand();
    expect(component.isExpanded()).toBe(initialState);
  });

  it('should search with debounce', fakeAsync(() => {
    // Perform search
    component.search('Toyota');
    
    // Search term should be set immediately
    expect(component.searchTerm()).toBe('Toyota');
    
    // But results should not be set until debounce time passes
    expect(component.searchResults().length).toBe(0);
    
    // Fast-forward debounce time
    tick(300);
    
    // Now results should be set
    expect(component.searchResults().length).toBe(1);
    expect(component.searchResults()[0].name).toBe('Toyota Camry');
  }));

  it('should clear previous timeout when searching again', fakeAsync(() => {
    // Spy on clearTimeout
    spyOn(window, 'clearTimeout').and.callThrough();
    
    // First search
    component.search('Toyota');
    
    // Second search before debounce completes
    component.search('Honda');
    
    // Should have cleared the timeout
    expect(clearTimeout).toHaveBeenCalled();
    
    // Fast-forward debounce time
    tick(300);
    
    // Should have results for Honda, not Toyota
    expect(component.searchResults().length).toBe(1);
    expect(component.searchResults()[0].name).toBe('Honda Civic');
  }));

  it('should clear results when search term is empty', fakeAsync(() => {
    // First search with term
    component.search('Toyota');
    tick(300);
    expect(component.searchResults().length).toBe(1);
    
    // Then search with empty term
    component.search('');
    tick(300);
    expect(component.searchResults().length).toBe(0);
  }));

  it('should search case-insensitively', fakeAsync(() => {
    component.search('toyota');
    tick(300);
    expect(component.searchResults().length).toBe(1);
    expect(component.searchResults()[0].name).toBe('Toyota Camry');
  }));

  it('should search by multiple fields', fakeAsync(() => {
    // Search by model
    component.search('model');
    tick(300);
    expect(component.searchResults().length).toBe(1);
    expect(component.searchResults()[0].name).toBe('Tesla Model 3');
    
    // Search by license plate
    component.search('ABC');
    tick(300);
    expect(component.searchResults().length).toBe(1);
    expect(component.searchResults()[0].name).toBe('Toyota Camry');
    
    // Search by status
    component.search('maintenance');
    tick(300);
    expect(component.searchResults().length).toBe(1);
    expect(component.searchResults()[0].name).toBe('Tesla Model 3');
  }));

  it('should select a car and update map', () => {
    const car = mockCars[0];
    component.selectCar(car);
    
    // Should call carDataService.selectCar
    expect(carDataServiceMock.selectCar).toHaveBeenCalledWith(car.id);
    
    // Should call mapService methods
    expect(mapServiceMock.setMapCenter).toHaveBeenCalledWith(car.latitude, car.longitude);
    expect(mapServiceMock.setMapZoom).toHaveBeenCalledWith(16);
    
    // Should clear search
    expect(component.searchTerm()).toBe('');
    expect(component.searchResults().length).toBe(0);
  });

  it('should add to recent searches when selecting a car', () => {
    const car = mockCars[0];
    component.selectCar(car);
    
    // Should add car name to recent searches
    expect(component.recentSearches()[0]).toBe(car.name);
    
    // Should save to localStorage
    expect(localStorage.setItem).toHaveBeenCalledWith('recentSearches', jasmine.any(String));
  });

  it('should limit recent searches to 5', () => {
    // Add 6 searches
    component.selectCar({ ...mockCars[0], name: 'Car 1' });
    component.selectCar({ ...mockCars[0], name: 'Car 2' });
    component.selectCar({ ...mockCars[0], name: 'Car 3' });
    component.selectCar({ ...mockCars[0], name: 'Car 4' });
    component.selectCar({ ...mockCars[0], name: 'Car 5' });
    component.selectCar({ ...mockCars[0], name: 'Car 6' });
    
    // Should only keep 5
    expect(component.recentSearches().length).toBe(5);
    
    // Should have newest first
    expect(component.recentSearches()[0]).toBe('Car 6');
    
    // Should not have the oldest
    expect(component.recentSearches().includes('Car 1')).toBeFalse();
  });

  it('should not add duplicate recent searches', () => {
    // Add same search twice
    component.selectCar({ ...mockCars[0], name: 'Toyota' });
    component.selectCar({ ...mockCars[0], name: 'Toyota' });
    
    // Should only have one entry
    expect(component.recentSearches().filter(s => s === 'Toyota').length).toBe(1);
  });

  it('should move existing search to top when used again', () => {
    // Add multiple searches
    component.selectCar({ ...mockCars[0], name: 'Car 1' });
    component.selectCar({ ...mockCars[0], name: 'Car 2' });
    component.selectCar({ ...mockCars[0], name: 'Car 3' });
    
    // Use first search again
    component.selectCar({ ...mockCars[0], name: 'Car 1' });
    
    // Should move to top
    expect(component.recentSearches()[0]).toBe('Car 1');
  });

  it('should use recent search', fakeAsync(() => {
    // Setup recent searches
    component.selectCar({ ...mockCars[0], name: 'Toyota' });
    
    // Spy on search method
    spyOn(component, 'search').and.callThrough();
    
    // Use recent search
    component.useRecentSearch('Toyota');
    
    // Should set search term
    expect(component.searchTerm()).toBe('Toyota');
    
    // Should call search
    expect(component.search).toHaveBeenCalledWith('Toyota');
  }));

  it('should remove recent search', () => {
    // Setup recent searches
    component.selectCar({ ...mockCars[0], name: 'Car 1' });
    component.selectCar({ ...mockCars[0], name: 'Car 2' });
    
    // Create mock event
    const mockEvent = jasmine.createSpyObj('Event', ['stopPropagation']);
    
    // Remove first search
    component.removeRecentSearch(0, mockEvent);
    
    // Should stop event propagation
    expect(mockEvent.stopPropagation).toHaveBeenCalled();
    
    // Should remove from list
    expect(component.recentSearches().includes('Car 2')).toBeFalse();
    
    // Should update localStorage
    expect(localStorage.setItem).toHaveBeenCalledWith('recentSearches', jasmine.any(String));
  });

  it('should clear search', () => {
    // Setup search
    component.searchTerm.set('Toyota');
    component.searchResults.set([mockCars[0]]);
    
    // Clear search
    component.clearSearch();
    
    // Should clear term and results
    expect(component.searchTerm()).toBe('');
    expect(component.searchResults().length).toBe(0);
  });

  it('should get correct status class', () => {
    expect(component.getStatusClass(CarStatus.AVAILABLE)).toBe(CarStatus.AVAILABLE);
    expect(component.getStatusClass(CarStatus.RENTED)).toBe(CarStatus.RENTED);
    expect(component.getStatusClass(CarStatus.MAINTENANCE)).toBe(CarStatus.MAINTENANCE);
  });

  it('should auto-expand when there are search results', fakeAsync(() => {
    // Initially collapsed
    component.isExpanded.set(false);
    
    // Search with results
    component.search('Toyota');
    tick(300);
    
    // Should auto-expand
    expect(component.isExpanded()).toBeTrue();
  }));

  // DOM Tests
  it('should render search input', () => {
    const input = fixture.debugElement.query(By.css('input[type="text"]'));
    expect(input).toBeTruthy();
  });

  it('should show clear button when search term exists', () => {
    // No clear button initially
    let clearButton = fixture.debugElement.query(By.css('.clear-button'));
    expect(clearButton).toBeFalsy();
    
    // Set search term
    component.searchTerm.set('Toyota');
    fixture.detectChanges();
    
    // Clear button should appear
    clearButton = fixture.debugElement.query(By.css('.clear-button'));
    expect(clearButton).toBeTruthy();
  });

  it('should show recent searches when available', () => {
    // Setup recent searches
    component.recentSearches.set(['Toyota', 'Honda']);
    fixture.detectChanges();
    
    // Should show recent searches section
    const recentSearches = fixture.debugElement.query(By.css('.recent-searches'));
    expect(recentSearches).toBeTruthy();
    
    // Should show correct number of items
    const items = fixture.debugElement.queryAll(By.css('.recent-searches li'));
    expect(items.length).toBe(2);
  });

  it('should show search results when available', fakeAsync(() => {
    // Search with results
    component.search('Toyota');
    tick(300);
    fixture.detectChanges();
    
    // Should show results section
    const resultsSection = fixture.debugElement.query(By.css('.search-results'));
    expect(resultsSection).toBeTruthy();
    
    // Should show correct number of results
    const results = fixture.debugElement.queryAll(By.css('.search-results li'));
    expect(results.length).toBe(1);
    
    // Should show car details
    const carName = fixture.debugElement.query(By.css('.car-name'));
    expect(carName.nativeElement.textContent).toContain('Toyota Camry');
  }));

  it('should show no results message when search has no matches', fakeAsync(() => {
    // Search with no results
    component.search('NonExistent');
    tick(300);
    fixture.detectChanges();
    
    // Should show no results message
    const noResults = fixture.debugElement.query(By.css('.no-results'));
    expect(noResults).toBeTruthy();
    expect(noResults.nativeElement.textContent).toContain('No cars found');
  }));

  it('should handle click on search result', fakeAsync(() => {
    // Spy on selectCar method
    spyOn(component, 'selectCar').and.callThrough();
    
    // Search with results
    component.search('Toyota');
    tick(300);
    fixture.detectChanges();
    
    // Click on result
    const result = fixture.debugElement.query(By.css('.search-results li'));
    result.triggerEventHandler('click', null);
    
    // Should call selectCar
    expect(component.selectCar).toHaveBeenCalledWith(mockCars[0]);
  }));

  it('should handle click on recent search', () => {
    // Setup recent searches
    component.recentSearches.set(['Toyota']);
    fixture.detectChanges();
    
    // Spy on useRecentSearch method
    spyOn(component, 'useRecentSearch').and.callThrough();
    
    // Click on recent search
    const recentSearch = fixture.debugElement.query(By.css('.recent-searches li'));
    recentSearch.triggerEventHandler('click', null);
    
    // Should call useRecentSearch
    expect(component.useRecentSearch).toHaveBeenCalledWith('Toyota');
  });

  it('should handle click on remove button for recent search', () => {
    // Setup recent searches
    component.recentSearches.set(['Toyota']);
    fixture.detectChanges();
    
    // Spy on removeRecentSearch method
    spyOn(component, 'removeRecentSearch').and.callThrough();
    
    // Click on remove button
    const removeButton = fixture.debugElement.query(By.css('.remove-button'));
    removeButton.triggerEventHandler('click', new MouseEvent('click'));
    
    // Should call removeRecentSearch
    expect(component.removeRecentSearch).toHaveBeenCalled();
  });

  it('should handle click on clear button', () => {
    // Setup search
    component.searchTerm.set('Toyota');
    fixture.detectChanges();
    
    // Spy on clearSearch method
    spyOn(component, 'clearSearch').and.callThrough();
    
    // Click on clear button
    const clearButton = fixture.debugElement.query(By.css('.clear-button'));
    clearButton.triggerEventHandler('click', null);
    
    // Should call clearSearch
    expect(component.clearSearch).toHaveBeenCalled();
  });

  it('should handle click on toggle expand', () => {
    // Spy on toggleExpand method
    spyOn(component, 'toggleExpand').and.callThrough();
    
    // Click on header
    const header = fixture.debugElement.query(By.css('.search-header'));
    header.triggerEventHandler('click', null);
    
    // Should call toggleExpand
    expect(component.toggleExpand).toHaveBeenCalled();
  });
});