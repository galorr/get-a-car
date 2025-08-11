import { Routes } from '@angular/router';
import { MapComponent } from './components/map/map.component';
import { CarGridComponent } from './components/car-grid/car-grid.component';
import { RegistrationComponent } from './components/registration/registration.component';
import { DataLoadedGuard } from './guards/data-loaded.guard';

export const routes: Routes = [
  { path: '', redirectTo: 'map', pathMatch: 'full' },
  { path: 'map', component: MapComponent },
  {
    path: 'cars',
    component: CarGridComponent,
    canActivate: [DataLoadedGuard]
  },
  {
    path: 'car/:id',
    component: MapComponent,
    canActivate: [DataLoadedGuard]
  },
  { path: 'register', component: RegistrationComponent },
  { path: '**', redirectTo: 'map' } // Wildcard route for 404
];