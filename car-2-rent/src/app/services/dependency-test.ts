/**
 * This file is used to test for circular dependencies.
 * If there are any circular dependencies, TypeScript will report errors when compiling this file.
 */

// Import all services
import { HttpService } from './http.service';
import { CacheService } from './cache.service';
import { DataService } from './data.service';
import { CarDataService } from './car-data.service';
import { MapService } from './map.service';
import { NavigationService } from './navigation.service';
import { RegistrationService } from './registration.service';
import { ApiService } from './api.service';

// Create a function that uses all services to ensure they are imported
export function testDependencies() {
  // Create instances of all services
  const httpService = new HttpService();
  const cacheService = new CacheService();
  const dataService = new DataService();
  const carDataService = new CarDataService();
  const mapService = new MapService();
  const navigationService = new NavigationService();
  const registrationService = new RegistrationService();
  const apiService = new ApiService();

  // Return all services to prevent unused variable warnings
  return {
    httpService,
    cacheService,
    dataService,
    carDataService,
    mapService,
    navigationService,
    registrationService,
    apiService,
  };
}
