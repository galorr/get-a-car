import { Component, inject, signal, effect, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { MapComponent } from './components/map/map.component';
import { CarGridComponent } from './components/car-grid/car-grid.component';
import { RegistrationComponent } from './components/registration/registration.component';
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
    RegistrationComponent,
    SearchComponent
  ],
  templateUrl: './app.html',
  styleUrls: ['./app.scss']
})
export class AppComponent {
  // Component state
  showRegistration = signal(true);
  isGridCollapsed = signal(false);
  selectedCar = signal<Car | null>(null);

  // Services
  private carDataService = inject(CarDataService);
  private cdr = inject(ChangeDetectorRef);

  constructor() {
    // Initialize the application
    this.initializeApp();
  }

  /**
   * Initialize the application
   */
  private initializeApp(): void {
    // Load initial car data
    this.carDataService.loadCars().subscribe({
      next: () => {
        console.log('Car data loaded successfully');
        this.cdr.detectChanges();
      },
      error: (error) => {
        console.error('Error loading car data:', error);
      }
    });
  }

  /**
   * Toggle grid collapse state
   */
  toggleGrid(collapsed: boolean): void {
    this.isGridCollapsed.set(collapsed);
  }

  /**
   * Toggle registration panel visibility
   */
  toggleRegistration(): void {
    this.showRegistration.update(value => !value);
  }

  /**
   * Handle car selection from map or grid
   */
  onCarSelected(car: Car): void {
    this.selectedCar.set(car);

    // Show registration panel if hidden
    if (!this.showRegistration()) {
      this.showRegistration.set(true);
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
   * Close registration panel
   */
  onRegistrationClose(): void {
    this.showRegistration.set(false);
  }
}
