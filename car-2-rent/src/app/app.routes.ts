import type { Routes } from '@angular/router';

import { MapComponent } from './components/map/map.component';

export const routes: Routes = [
  { path: '', redirectTo: 'map', pathMatch: 'full' },
  { path: 'map', component: MapComponent },
  { path: '**', redirectTo: 'map' }, // Wildcard route for 404
];
