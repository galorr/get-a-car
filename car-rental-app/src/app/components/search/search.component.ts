import { Component, inject, signal, Output, EventEmitter, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CarDataService } from '../../services/car-data.service';
import { Car } from '../../models/car.model';

@Component({
  selector: 'app-search',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './search.component.html',
  styleUrls: ['./search.component.scss']
})
export class SearchComponent {
  // Search state
  searchTerm = signal('');
  searchResults = signal<Car[]>([]);
  isSearching = signal(false);
  showResults = signal(false);

  // Events
  @Output() carSelected = new EventEmitter<Car>();
  @Output() search = new EventEmitter<string>();

  // Services
  private carDataService = inject(CarDataService);
  private cdr = inject(ChangeDetectorRef);

  /**
   * Handle search input
   */
  onSearch(event: Event): void {
    const term = (event.target as HTMLInputElement).value;
    this.searchTerm.set(term);

    // Emit search event for parent components
    this.search.emit(term);

    // Perform search
    this.performSearch(term);
  }

  /**
   * Perform search on car data
   */
  private performSearch(term: string): void {
    if (!term.trim()) {
      this.searchResults.set([]);
      this.showResults.set(false);
      return;
    }

    this.isSearching.set(true);

    // Get all cars from the service
    const allCars = this.carDataService.allCars();

    // Filter cars based on search term
    const filteredCars = allCars.filter(car =>
      car.id.toLowerCase().includes(term.toLowerCase()) ||
      car.name.toLowerCase().includes(term.toLowerCase()) ||
      car.status.toLowerCase().includes(term.toLowerCase())
    );

    // Update search results
    this.searchResults.set(filteredCars);
    this.showResults.set(true);
    this.isSearching.set(false);

    // Manually trigger change detection
    this.cdr.detectChanges();
  }

  /**
   * Clear search
   */
  clearSearch(): void {
    this.searchTerm.set('');
    this.searchResults.set([]);
    this.showResults.set(false);

    // Emit empty search event
    this.search.emit('');
  }

  /**
   * Select a car from search results
   */
  selectCar(car: Car): void {
    this.carSelected.emit(car);
    this.showResults.set(false);
  }

  /**
   * Close search results
   */
  closeResults(): void {
    this.showResults.set(false);
  }
}
