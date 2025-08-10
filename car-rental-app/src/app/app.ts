import { Component, inject, signal, computed, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { MapComponent } from './components/map/map.component';
import { CarGridComponent } from './components/car-grid/car-grid.component';
import { SideNavComponent } from './components/side-nav/side-nav.component';
import { SearchComponent } from './components/search/search.component';
import { CarDataService } from './services/car-data.service';
import { Car } from './models/car.model';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    CommonModule,
    RouterOutlet,
    MapComponent,
    CarGridComponent,
    SideNavComponent,
    SearchComponent
  ],
  templateUrl: './app.html',
  styleUrls: ['./app.scss']
})
export class AppComponent {
  // Component state using signals
  showSideNav = signal(true);
  isGridCollapsed = signal(false);
  selectedCar = signal<Car | null>(null);
  isLoading = signal(false);
  loadError = signal<string | null>(null);

  // Services
  private carDataService = inject(CarDataService);

  constructor() {
    // Initialize the application using effect instead of subscription
    effect(() => {
      this.initializeApp();
    });
  }

  /**
   * Initialize the application
   */
  private initializeApp(): void {
    // Load initial car data using signals
    this.isLoading.set(true);
    this.loadError.set(null);

    // Use the effect to handle the async operation
    this.carDataService.loadCars();

    // Create an effect to handle loading state changes
    effect(() => {
      const cars = this.carDataService.allCars();
      if (cars.length > 0) {
        this.isLoading.set(false);
        console.log('Car data loaded successfully');
      }
    });
  }

  /**
   * Public method to retry loading data
   */
  retryLoading(): void {
    this.initializeApp();
  }

  /**
   * Toggle grid collapse state
   */
  toggleGrid(collapsed: boolean): void {
    this.isGridCollapsed.set(collapsed);
  }

  /**
   * Toggle side nav panel visibility
   */
  toggleSideNav(): void {
    this.showSideNav.update(value => !value);
  }

  /**
   * Handle car selection from map or grid
   */
  onCarSelected(car: Car): void {
    this.selectedCar.set(car);

    // Show side nav panel if hidden
    if (!this.showSideNav()) {
      this.showSideNav.set(true);
    }
  }

  /**
   * Handle search event
   */
  onSearch(searchTerm: string): void {
    console.log('Search term:', searchTerm);
    // Additional search handling if needed
  }

  /**
   * Close side nav panel
   */
  onSideNavClose(): void {
    this.showSideNav.set(false);
  }
}
