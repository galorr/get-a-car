import { CommonModule } from '@angular/common';
import {
  Component,
  ChangeDetectionStrategy,
  signal,
  effect,
  inject,
  HostListener,
  runInInjectionContext,
  Injector,
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
export class AppComponent {
  title = 'car-2-rent';

  // Inject services
  private dataService = inject(DataService);
  private navigationService = inject(NavigationService);
  private mapService = inject(MapService);
  private injector = inject(Injector);

  // Signals for UI state
  isGridCollapsed = signal(false);
  isLoading = signal(true);

  // Navigation state
  currentRoute = signal('/');
  isNavigating = signal(false);

  constructor() {
    // Load initial data
    this.loadInitialData();

    // Setup effects using runInInjectionContext
    runInInjectionContext(this.injector, () => {
      // Setup effect to auto-collapse grid on mobile when a car is selected
      effect(() => {
        const selectedCar = this.dataService.selectedCar();
        if (selectedCar && !this.isGridCollapsed()) {
          this.isGridCollapsed.set(true);
        }
      });

      // Track navigation state
      effect(() => {
        const navigating = this.navigationService.isNavigating();
        this.isNavigating.set(navigating);
      });

      // Track current route
      effect(() => {
        const route = this.navigationService.currentRoute();
        this.currentRoute.set(route);
      });
    });
  }

  // Methods to toggle UI elements
  toggleGrid(): void {
    this.isGridCollapsed.update(value => !value);
  }

  // Load initial data
  private async loadInitialData(): Promise<void> {
    this.isLoading.set(true);

    try {
      // Simulate network delay
      await new Promise(resolve => setTimeout(resolve, 1000));

      this.navigationService.isNavigating.set(true);

      try {
        // Load car data
        const cars = await new Promise((resolve, reject) => {
          this.dataService.loadCars().subscribe({
            next: loadedCars => {
              resolve(loadedCars);
            },
            error: error => {
              reject(error);
            },
          });
        });

        // Load user data
        await new Promise((resolve, reject) => {
          this.dataService.loadUsers().subscribe({
            next: users => {
              resolve(users);
            },
            error: error => {
              reject(error);
            },
          });
        });

        // Set initial map center based on cars
        const allCars = this.dataService.cars();
        if (allCars && allCars.length > 0) {
          // Calculate center point of all cars
          const totalLat = allCars.reduce((sum, car) => sum + car.latitude, 0);
          const totalLng = allCars.reduce((sum, car) => sum + car.longitude, 0);
          const centerLat = totalLat / allCars.length;
          const centerLng = totalLng / allCars.length;

          this.mapService.setMapCenter(centerLat, centerLng);
        }
      } catch (dataError) {
        // Error loading data
      } finally {
        this.navigationService.isNavigating.set(false);
      }
    } catch (error) {
      this.navigationService.isNavigating.set(false);
    } finally {
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
