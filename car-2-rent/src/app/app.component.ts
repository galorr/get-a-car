import { Component, ChangeDetectionStrategy, signal, effect, inject, HostListener, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet, Router, NavigationEnd, ActivatedRoute } from '@angular/router';
import { filter } from 'rxjs/operators';

// Import components
import { MapComponent } from './components/map/map.component';
import { CarGridComponent } from './components/car-grid/car-grid.component';
import { RegistrationComponent } from './components/registration/registration.component';
import { SearchComponent } from './components/search/search.component';
import { SideNavComponent } from './components/side-nav/side-nav.component';

// Import services
import { CarDataService } from './services/car-data.service';
import { MapService } from './services/map.service';
import { NavigationService } from './services/navigation.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    CommonModule,
    RouterOutlet,
    MapComponent,
    CarGridComponent,
    RegistrationComponent,
    SearchComponent,
    SideNavComponent
  ],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AppComponent implements OnInit {
  title = 'car-2-rent';
  
  private carDataService = inject(CarDataService);
  private mapService = inject(MapService);
  private navigationService = inject(NavigationService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  
  // Signals for UI state
  showRegistration = signal(true);
  isGridCollapsed = signal(false);
  isLoading = signal(true);
  
  // Navigation state
  currentRoute = signal('/');
  isNavigating = signal(false);
  
  // Responsive layout signals
  isMobile = signal(window.innerWidth < 768);
  
  constructor() {
    // Load initial data
    this.loadInitialData();
    
    // Setup effect to auto-collapse grid on mobile when a car is selected
    effect(() => {
      const selectedCar = this.carDataService.selectedCar();
      if (selectedCar && this.isMobile() && !this.isGridCollapsed()) {
        this.isGridCollapsed.set(true);
      }
    });
    
    // Track navigation state
    effect(() => {
      this.isNavigating.set(this.navigationService.isNavigating());
    });
    
    // Track current route
    effect(() => {
      this.currentRoute.set(this.navigationService.currentRoute());
    });
  }
  
  ngOnInit(): void {
    // Subscribe to route changes to handle deep linking
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe(() => {
      this.handleRouteParams();
    });
    
    // Initial route params handling
    this.handleRouteParams();
  }
  
  // Handle route parameters for deep linking
  private handleRouteParams(): void {
    // Handle car/:id route
    if (this.router.url.startsWith('/car/')) {
      const carId = this.router.url.split('/').pop();
      if (carId) {
        this.navigationService.handleCarDeepLink(carId);
      }
    }
    
    // Handle map route with query params
    if (this.router.url.startsWith('/map')) {
      this.route.queryParams.subscribe(params => {
        this.navigationService.parseMapParams(params);
      });
    }
  }
  
  // Methods to toggle UI elements
  toggleGrid(): void {
    this.isGridCollapsed.update(value => !value);
  }
  
  toggleRegistration(): void {
    this.showRegistration.update(value => !value);
  }
  
  // Load initial data
  private async loadInitialData(): Promise<void> {
    this.isLoading.set(true);
    
    try {
      // In a real app, this would be an API call
      // For now, the service loads mock data
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate network delay
      
      // Data is loaded in the service constructor
      
      // Set initial map center based on cars
      const cars = this.carDataService.getCars();
      if (cars.length > 0) {
        // Calculate center point of all cars
        const totalLat = cars.reduce((sum, car) => sum + car.latitude, 0);
        const totalLng = cars.reduce((sum, car) => sum + car.longitude, 0);
        const centerLat = totalLat / cars.length;
        const centerLng = totalLng / cars.length;
        
        this.mapService.setMapCenter(centerLat, centerLng);
      }
    } finally {
      this.isLoading.set(false);
    }
  }
  
  // Handle window resize for responsive layout
  @HostListener('window:resize')
  onResize(): void {
    this.isMobile.set(window.innerWidth < 768);
    
    // Auto-collapse grid on mobile
    if (this.isMobile() && !this.isGridCollapsed()) {
      this.isGridCollapsed.set(true);
    }
  }
}