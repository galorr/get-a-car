import { Component, inject, signal, computed, effect, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
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
  isLoading = signal(true);
  loadError = signal<string | null>(null);

  // Services
  private carDataService = inject(CarDataService);
private cdr = inject(ChangeDetectorRef);

  constructor() {
    effect(() => {
//  this.initializeApp();
    });
  }

  /**
   * Initialize the application
   */
  private initializeApp(): void {
     // Load initial car data using signals
    this.isLoading.set(true);
    this.loadError.set(null);

     // Load initial car data
    this.carDataService.loadCars().subscribe({
      next: () => {

    // Create an effect to handle loading state changes
      const cars = this.carDataService.allCars();
      if (cars.length > 0) {
        this.isLoading.set(false);
        console.log('Car data loaded successfully');
        this.cdr.detectChanges();
      }
    },
      error: (error: any) => {
        console.error('Error loading car data:', error);
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
