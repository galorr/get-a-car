import { Component, signal, inject, ChangeDetectionStrategy, ChangeDetectorRef, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CarDataService } from '../../services/car-data.service';
import { MapService } from '../../services/map.service';
import { Car, CarStatus } from '../../models/car.model';

@Component({
  selector: 'app-search',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './search.component.html',
  styleUrls: ['./search.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SearchComponent {
  private carDataService = inject(CarDataService);
  private mapService = inject(MapService);
  private cdr = inject(ChangeDetectorRef);
  
  searchTerm = signal('');
  searchResults = signal<Car[]>([]);
  isExpanded = signal(false);
  recentSearches = signal<string[]>([]);
  
  // Debounce timer
  private searchTimeout: any = null;
  
  constructor() {
    // Load recent searches from localStorage
    const savedSearches = localStorage.getItem('recentSearches');
    if (savedSearches) {
      try {
        this.recentSearches.set(JSON.parse(savedSearches));
      } catch (e) {
        console.error('Error parsing recent searches:', e);
        this.recentSearches.set([]);
      }
    }
    
    // Setup effect to auto-expand when there are search results
    effect(() => {
      if (this.searchResults().length > 0 && !this.isExpanded()) {
        this.isExpanded.set(true);
      }
    });
  }
  
  toggleExpand(): void {
    this.isExpanded.update(value => !value);
  }
  
  search(term: string): void {
    this.searchTerm.set(term);
    
    // Clear previous timeout
    if (this.searchTimeout) {
      clearTimeout(this.searchTimeout);
    }
    
    // Debounce search to avoid excessive filtering
    this.searchTimeout = setTimeout(() => {
      if (!term.trim()) {
        this.searchResults.set([]);
        return;
      }
      
      const normalizedTerm = term.toLowerCase();
      const results = this.carDataService.getCars().filter(car =>
        car.id.toLowerCase().includes(normalizedTerm) ||
        car.name.toLowerCase().includes(normalizedTerm) ||
        car.status.toLowerCase().includes(normalizedTerm) ||
        (car.model && car.model.toLowerCase().includes(normalizedTerm)) ||
        (car.licensePlate && car.licensePlate.toLowerCase().includes(normalizedTerm))
      );
      
      this.searchResults.set(results);
      this.cdr.detectChanges();
    }, 300); // 300ms debounce
  }
  
  selectCar(car: Car): void {
    // Add to recent searches
    this.addToRecentSearches(car.name);
    
    // Select the car
    this.carDataService.selectCar(car.id);
    
    // Center the map on the car's location
    this.mapService.setMapCenter(car.latitude, car.longitude);
    
    // Zoom in
    this.mapService.setMapZoom(16);
    
    // Clear search results
    this.clearSearch();
  }
  
  clearSearch(): void {
    this.searchTerm.set('');
    this.searchResults.set([]);
  }
  
  useRecentSearch(term: string): void {
    this.searchTerm.set(term);
    this.search(term);
  }
  
  removeRecentSearch(index: number, event: Event): void {
    event.stopPropagation();
    
    const searches = [...this.recentSearches()];
    searches.splice(index, 1);
    this.recentSearches.set(searches);
    
    // Update localStorage
    localStorage.setItem('recentSearches', JSON.stringify(searches));
  }
  
  private addToRecentSearches(term: string): void {
    // Don't add empty terms
    if (!term.trim()) return;
    
    const searches = [...this.recentSearches()];
    
    // Remove if already exists
    const existingIndex = searches.indexOf(term);
    if (existingIndex !== -1) {
      searches.splice(existingIndex, 1);
    }
    
    // Add to beginning
    searches.unshift(term);
    
    // Limit to 5 recent searches
    if (searches.length > 5) {
      searches.pop();
    }
    
    this.recentSearches.set(searches);
    
    // Update localStorage
    localStorage.setItem('recentSearches', JSON.stringify(searches));
  }
  
  getStatusClass(status: CarStatus): string {
    return status;
  }
}