import { CommonModule } from '@angular/common';
import type { OnInit } from '@angular/core';
import {
  Component,
  ChangeDetectionStrategy,
  signal,
  effect,
  inject,
  HostListener,
} from '@angular/core';
import { RouterOutlet } from '@angular/router';

// Import components
import { CarGridComponent } from './components/car-grid/car-grid.component';
// import { MapComponent } from './components/map/map.component';
// import { RegistrationComponent } from './components/registration/registration.component';
import { SideNavComponent } from './components/side-nav/side-nav.component';

// Import services
import { DataService } from './services/data.service';
import { MapService } from './services/map.service';
import { NavigationService } from './services/navigation.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    CommonModule,
    RouterOutlet,
    // MapComponent,
    CarGridComponent,
    // RegistrationComponent,
    SideNavComponent,
  ],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AppComponent implements OnInit {
  title = 'car-2-rent';

  // Inject services
  private dataService = inject(DataService);
  private navigationService = inject(NavigationService);
  private mapService = inject(MapService);

  // Signals for UI state
  isGridCollapsed = signal(false);
  isLoading = signal(true);

  // Navigation state
  currentRoute = signal('/');
  isNavigating = signal(false);

  constructor() {
    console.log('[AppComponent] Constructor initialized');

    // Load initial data
    this.loadInitialData();

    console.log('[AppComponent] Setting up effects');

    // Setup effect to auto-collapse grid on mobile when a car is selected
    effect(() => {
      const selectedCar = this.dataService.selectedCar();
      console.log(
        '[AppComponent] Effect: selectedCar changed',
        selectedCar?.id
      );
      if (selectedCar && !this.isGridCollapsed()) {
        this.isGridCollapsed.set(true);
      }
    });

    // Track navigation state
    effect(() => {
      const navigating = this.navigationService.isNavigating();
      console.log('[AppComponent] Effect: isNavigating changed', navigating);
      this.isNavigating.set(navigating);
    });

    // Track current route
    effect(() => {
      const route = this.navigationService.currentRoute();
      console.log('[AppComponent] Effect: currentRoute changed', route);
      this.currentRoute.set(route);
    });
  }

  ngOnInit(): void {
    console.log('[AppComponent] ngOnInit');
    console.log('[AppComponent] Initial route params handled');
  }

  // Methods to toggle UI elements
  toggleGrid(): void {
    this.isGridCollapsed.update(value => !value);
  }

  // Load initial data
  private async loadInitialData(): Promise<void> {
    console.log('[AppComponent] loadInitialData: Starting data load');
    this.isLoading.set(true);

    try {
      // Simulate network delay
      console.log('[AppComponent] loadInitialData: Simulating network delay');
      await new Promise(resolve => setTimeout(resolve, 1000));

      console.log('[AppComponent] loadInitialData: Network delay complete');
      this.navigationService.isNavigating.set(true);

      // DIAGNOSTIC: Check if services are properly injected
      console.log('[AppComponent] DIAGNOSTIC: Service instances:', {
        dataService: !!this.dataService,
        navigationService: !!this.navigationService,
        mapService: !!this.mapService,
      });

      try {
        // Load car data
        console.log('[AppComponent] loadInitialData: Loading cars');
        const cars = await new Promise((resolve, reject) => {
          this.dataService.loadCars().subscribe({
            next: loadedCars => {
              console.log(
                '[AppComponent] loadInitialData: Cars loaded successfully',
                { count: loadedCars?.length || 0 }
              );
              resolve(loadedCars);
            },
            error: error => {
              console.error(
                '[AppComponent] loadInitialData: Error loading cars',
                error
              );
              reject(error);
            },
          });
        });

        // Load user data
        console.log('[AppComponent] loadInitialData: Loading users');
        await new Promise((resolve, reject) => {
          this.dataService.loadUsers().subscribe({
            next: users => {
              console.log(
                '[AppComponent] loadInitialData: Users loaded successfully',
                { count: users?.length || 0 }
              );
              resolve(users);
            },
            error: error => {
              console.error(
                '[AppComponent] loadInitialData: Error loading users',
                error
              );
              reject(error);
            },
          });
        });

        console.log(
          '[AppComponent] loadInitialData: All data loaded successfully'
        );

        // Set initial map center based on cars
        const allCars = this.dataService.cars();
        if (allCars && allCars.length > 0) {
          // Calculate center point of all cars
          const totalLat = allCars.reduce((sum, car) => sum + car.latitude, 0);
          const totalLng = allCars.reduce((sum, car) => sum + car.longitude, 0);
          const centerLat = totalLat / allCars.length;
          const centerLng = totalLng / allCars.length;

          console.log('[AppComponent] loadInitialData: Setting map center', {
            centerLat,
            centerLng,
          });
          this.mapService.setMapCenter(centerLat, centerLng);
        } else {
          console.warn(
            '[AppComponent] loadInitialData: No cars available to set map center'
          );
        }
      } catch (dataError) {
        console.error(
          '[AppComponent] loadInitialData: Error loading data',
          dataError
        );
      } finally {
        this.navigationService.isNavigating.set(false);
      }
    } catch (error) {
      console.error(
        '[AppComponent] loadInitialData: Error in initialization process',
        error
      );
      this.navigationService.isNavigating.set(false);
    } finally {
      console.log(
        '[AppComponent] loadInitialData: Completed, setting isLoading to false'
      );
      this.isLoading.set(false);
    }
  }

  // Handle window resize for responsive layout
  @HostListener('window:resize')
  onResize(): void {
    // Auto-collapse grid on mobile
    if (!this.isGridCollapsed()) {
      this.isGridCollapsed.set(true);
    }
  }
}
