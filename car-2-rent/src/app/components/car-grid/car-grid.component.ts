import { Component, signal, inject, Output, EventEmitter, ChangeDetectionStrategy, ChangeDetectorRef, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AgGridModule } from 'ag-grid-angular';
import { ColDef, GridReadyEvent, RowSelectedEvent, GridApi, CellClickedEvent, DomLayoutType } from 'ag-grid-community';
import { CarDataService } from '../../services/car-data.service';
import { Car, CarStatus } from '../../models/car.model';

@Component({
  selector: 'app-car-grid',
  standalone: true,
  imports: [CommonModule, FormsModule, AgGridModule],
  templateUrl: './car-grid.component.html',
  styleUrls: ['./car-grid.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CarGridComponent {
  @Output() toggleGrid = new EventEmitter<void>();

  private carDataService = inject(CarDataService);
  private cdr = inject(ChangeDetectorRef);

  cars = signal<Car[]>([]);
  isCollapsed = signal(false);
  selectedCarId = signal<string | null>(null);

  // Grid API reference
  private gridApi: GridApi | null = null;

  // Column definitions for AG Grid
  columnDefs: ColDef[] = [
    {
      field: 'id',
      headerName: 'Car ID',
      sortable: true,
      filter: true,
      width: 120,
      cellClass: (params: any) => this.getSelectedClass(params.data?.id)
    },
    {
      field: 'name',
      headerName: 'Car Name',
      sortable: true,
      filter: true,
      flex: 1,
      cellClass: (params: any) => this.getSelectedClass(params.data?.id)
    },
    {
      field: 'status',
      headerName: 'Status',
      sortable: true,
      filter: true,
      width: 120,
      cellRenderer: (params: any) => {
        const status = params.value as CarStatus;
        return `<span class="status-badge ${status}">${status}</span>`;
      },
      cellClass: (params: any) => this.getSelectedClass(params.data?.id)
    },
    {
      field: 'latitude',
      headerName: 'Latitude',
      sortable: true,
      filter: true,
      width: 120,
      valueFormatter: (params: any) => params.value.toFixed(6),
      cellClass: (params: any) => this.getSelectedClass(params.data?.id)
    },
    {
      field: 'longitude',
      headerName: 'Longitude',
      sortable: true,
      filter: true,
      width: 120,
      valueFormatter: (params: any) => params.value.toFixed(6),
      cellClass: (params: any) => this.getSelectedClass(params.data?.id)
    },
    {
      field: 'lastUpdated',
      headerName: 'Last Updated',
      sortable: true,
      filter: true,
      width: 180,
      valueFormatter: (params: any) => new Date(params.value).toLocaleString(),
      cellClass: (params: any) => this.getSelectedClass(params.data?.id)
    }
  ];

  // Default grid options
  gridOptions = {
    rowSelection: 'single' as 'single',
    animateRows: true,
    domLayout: 'autoHeight' as DomLayoutType,
    rowHeight: 48,
    headerHeight: 48,
    defaultColDef: {
      resizable: true
    }
  };

  constructor() {
    // Initialize with cars from service
    this.cars.set(this.carDataService.getCars());

    // Setup effect to track selected car changes
    effect(() => {
      const selectedCar = this.carDataService.selectedCar();
      if (selectedCar) {
        this.selectedCarId.set(selectedCar.id);
        this.highlightSelectedRow(selectedCar.id);
      } else {
        this.selectedCarId.set(null);
        this.clearRowSelection();
      }
    });

    // Setup effect to track car data changes
    effect(() => {
      const allCars = this.carDataService.getCars();
      this.cars.set(allCars);
      this.cdr.detectChanges();

      // Update grid if API is available
      if (this.gridApi) {
        this.gridApi.setRowData(allCars);
      }
    });
  }

  onGridReady(params: GridReadyEvent): void {
    this.gridApi = params.api;

    // Resize columns to fit the available width
    params.api.sizeColumnsToFit();

    // Update grid when window resizes
    window.addEventListener('resize', () => {
      setTimeout(() => {
        params.api.sizeColumnsToFit();
      });
    });

    // If there's a selected car, highlight it
    const selectedId = this.selectedCarId();
    if (selectedId) {
      this.highlightSelectedRow(selectedId);
    }
  }

  onRowSelected(event: RowSelectedEvent): void {
    if (event.node.isSelected()) {
      const car = event.data as Car;
      this.carDataService.selectCar(car.id);
    }
  }

  onCellClicked(event: CellClickedEvent): void {
    const car = event.data as Car;
    this.carDataService.selectCar(car.id);
  }

  onSearch(event: Event): void {
    const searchTerm = (event.target as HTMLInputElement).value.toLowerCase();

    if (!searchTerm) {
      // If search is cleared, reset to all cars
      this.cars.set(this.carDataService.getCars());
      if (this.gridApi) {
        this.gridApi.setRowData(this.carDataService.getCars());
      }
      return;
    }

    // Filter cars based on search term
    const filteredCars = this.carDataService.getCars().filter(car =>
      car.id.toLowerCase().includes(searchTerm) ||
      car.name.toLowerCase().includes(searchTerm) ||
      car.status.toLowerCase().includes(searchTerm) ||
      (car.model && car.model.toLowerCase().includes(searchTerm)) ||
      (car.licensePlate && car.licensePlate.toLowerCase().includes(searchTerm))
    );

    this.cars.set(filteredCars);
    if (this.gridApi) {
      this.gridApi.setRowData(filteredCars);
    }
    this.cdr.detectChanges();
  }

  toggleGridView(): void {
    this.isCollapsed.update(value => !value);
    this.toggleGrid.emit();

    // Resize grid after animation completes
    setTimeout(() => {
      if (this.gridApi) {
        this.gridApi.sizeColumnsToFit();
      }
    }, 300);
  }

  private highlightSelectedRow(carId: string): void {
    if (!this.gridApi) return;

    // Clear current selection
    this.gridApi.deselectAll();

    // Find and select the row
    this.gridApi.forEachNode(node => {
      if (node.data && node.data.id === carId) {
        node.setSelected(true);

        // Scroll to the selected row
        this.gridApi!.ensureNodeVisible(node, 'middle');
      }
    });

    // Force refresh to apply cell styling
    this.gridApi.refreshCells();
  }

  private clearRowSelection(): void {
    if (this.gridApi) {
      this.gridApi.deselectAll();
      this.gridApi.refreshCells();
    }
  }

  private getSelectedClass(carId?: string): string {
    return carId && carId === this.selectedCarId() ? 'selected-row' : '';
  }
}
