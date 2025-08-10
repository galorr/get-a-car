import { Component, inject, signal, effect, ChangeDetectorRef, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AgGridModule } from 'ag-grid-angular';
import { ColDef, GridReadyEvent, RowSelectedEvent, GridApi, ModuleRegistry, AllCommunityModule, GridOptions } from 'ag-grid-community';
import { CarDataService } from '../../services/car-data.service';
import { Car, CarStatus } from '../../models/car.model';

// Register AG Grid modules
ModuleRegistry.registerModules([AllCommunityModule]);

@Component({
  selector: 'app-car-grid',
  standalone: true,
  imports: [CommonModule, AgGridModule],
  templateUrl: './car-grid.component.html',
  styleUrls: ['./car-grid.component.scss']
})
export class CarGridComponent {
  // Grid data
  cars = signal<Car[]>([]);
  isCollapsed = signal(false);
  searchTerm = signal('');

  // Grid API
  private gridApi: GridApi | null = null;

  // Column definitions
  columnDefs: ColDef[] = [
    { field: 'id', headerName: 'Car ID', sortable: true, filter: true },
    { field: 'name', headerName: 'Car Name', sortable: true, filter: true },
    { field: 'status', headerName: 'Status', sortable: true, filter: true },
    { field: 'latitude', headerName: 'Latitude', sortable: true, filter: true },
    { field: 'longitude', headerName: 'Longitude', sortable: true, filter: true },
    {
      field: 'lastUpdated',
      headerName: 'Last Updated',
      sortable: true,
      filter: true,
      valueFormatter: params => new Date(params.value).toLocaleString()
    }
  ];

  // Grid options
  gridOptions: GridOptions = {
    rowSelection: { mode: 'singleRow' }, // Updated to object format for AG Grid v32.2.1+
    theme: 'legacy', // Use legacy theme to avoid conflicts with CSS imports
    getRowId: (params: any) => params.data.id
  };

  // Default column definitions
  defaultColDef: ColDef = {
    flex: 1,
    minWidth: 100,
    resizable: true
  };

  // Event emitters
  @Output() toggleGrid = new EventEmitter<boolean>();
  @Output() carSelected = new EventEmitter<Car>();

  // Services
  private carDataService = inject(CarDataService);
  private cdr = inject(ChangeDetectorRef);

  constructor() {
    // Subscribe to car data changes using signals
    effect(() => {
      const allCars = this.carDataService.allCars();
      this.updateGridData(allCars);
    });
  }

  /**
   * Update grid data with filtering based on search term
   */
  private updateGridData(cars: Car[]): void {
    const term = this.searchTerm().toLowerCase();

    // Apply search filter if there is a search term
    const filteredCars = term
      ? cars.filter(car =>
          car.id.toLowerCase().includes(term) ||
          car.name.toLowerCase().includes(term) ||
          car.status.toLowerCase().includes(term))
      : cars;

    this.cars.set(filteredCars);

    // Update grid if it's already initialized
    if (this.gridApi) {
      // Use the newer AG Grid API method
      this.gridApi.applyTransaction({ update: filteredCars });
    }

    // Manually trigger change detection
    this.cdr.detectChanges();
  }

  /**
   * Handle grid ready event
   */
  onGridReady(params: GridReadyEvent): void {
    this.gridApi = params.api;

    // Set initial row data
    this.gridApi.applyTransaction({ add: this.cars() });

    // Auto-size columns to fit the available width
    this.gridApi.sizeColumnsToFit();
  }

  /**
   * Handle row selection event
   */
  onRowSelected(event: RowSelectedEvent): void {
    if (event.node.isSelected()) {
      this.carSelected.emit(event.data as Car);
    }
  }

  /**
   * Handle search input
   */
  onSearch(event: Event): void {
    const searchTerm = (event.target as HTMLInputElement).value;
    this.searchTerm.set(searchTerm);

    // Update grid data with the new search term
    this.updateGridData(this.carDataService.allCars());
  }

  /**
   * Toggle grid collapse state
   */
  toggleCollapse(): void {
    this.isCollapsed.update(value => !value);
    this.toggleGrid.emit(this.isCollapsed());

    // Resize grid after toggling
    setTimeout(() => {
      if (this.gridApi) {
        this.gridApi.sizeColumnsToFit();
      }
    }, 300);
  }
}
