import { Component, inject, signal, ChangeDetectionStrategy, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, RouterLink, RouterLinkActive } from '@angular/router';
import { NavigationService } from '../../services/navigation.service';
import { CarDataService } from '../../services/car-data.service';

@Component({
  selector: 'app-side-nav',
  standalone: true,
  imports: [CommonModule, RouterModule, RouterLink, RouterLinkActive],
  templateUrl: './side-nav.component.html',
  styleUrls: ['./side-nav.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SideNavComponent {
  private navigationService = inject(NavigationService);
  private carDataService = inject(CarDataService);
  
  // UI state signals
  isCollapsed = signal<boolean>(window.innerWidth < 768);
  isMobile = signal<boolean>(window.innerWidth < 768);
  
  // Navigation links
  navLinks = [
    { path: '/map', label: 'Map View', icon: 'map' },
    { path: '/cars', label: 'Car List', icon: 'list' },
    { path: '/register', label: 'Registration', icon: 'person_add' }
  ];
  
  // Current route
  currentRoute = this.navigationService.currentRoute;
  
  // Selected car
  selectedCar = this.carDataService.selectedCar;
  
  constructor() {}
  
  /**
   * Toggle the side navigation collapse state
   */
  toggleNav(): void {
    this.isCollapsed.update(value => !value);
  }
  
  /**
   * Navigate to a specific route
   * @param path The route path
   */
  navigate(path: string): void {
    if (path === '/map') {
      this.navigationService.navigateToMap();
    } else if (path === '/cars') {
      this.navigationService.navigateToCars();
    } else if (path === '/register') {
      this.navigationService.navigateToRegistration();
    }
    
    // Auto-collapse on mobile after navigation
    if (this.isMobile()) {
      this.isCollapsed.set(true);
    }
  }
  
  /**
   * Navigate to a specific car
   * @param carId The car ID
   */
  navigateToCar(carId: string): void {
    this.navigationService.navigateToCar(carId);
    
    // Auto-collapse on mobile after navigation
    if (this.isMobile()) {
      this.isCollapsed.set(true);
    }
  }
  
  /**
   * Check if a route is active
   * @param path The route path
   * @returns True if the route is active
   */
  isRouteActive(path: string): boolean {
    return this.currentRoute().startsWith(path);
  }
  
  /**
   * Handle window resize events
   */
  @HostListener('window:resize')
  onResize(): void {
    const isMobileView = window.innerWidth < 768;
    this.isMobile.set(isMobileView);
    
    // Auto-collapse on mobile
    if (isMobileView && !this.isCollapsed()) {
      this.isCollapsed.set(true);
    }
  }
}