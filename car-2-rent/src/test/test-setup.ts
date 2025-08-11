import { TestBed } from '@angular/core/testing';
import { BrowserDynamicTestingModule, platformBrowserDynamicTesting } from '@angular/platform-browser-dynamic/testing';
import * as L from 'leaflet';

// First, initialize the Angular testing environment
TestBed.initTestEnvironment(
  BrowserDynamicTestingModule,
  platformBrowserDynamicTesting(),
  {
    teardown: { destroyAfterEach: true }
  }
);

// Mock for Leaflet to avoid issues in tests
(window as any).L = {
  map: jasmine.createSpy('map').and.returnValue({
    setView: jasmine.createSpy('setView').and.returnValue({}),
    remove: jasmine.createSpy('remove'),
    invalidateSize: jasmine.createSpy('invalidateSize')
  }),
  tileLayer: jasmine.createSpy('tileLayer').and.returnValue({
    addTo: jasmine.createSpy('addTo').and.returnValue({})
  }),
  marker: jasmine.createSpy('marker').and.returnValue({
    setLatLng: jasmine.createSpy('setLatLng').and.returnValue({}),
    bindPopup: jasmine.createSpy('bindPopup').and.returnValue({}),
    addTo: jasmine.createSpy('addTo').and.returnValue({}),
    getLatLng: jasmine.createSpy('getLatLng').and.returnValue({ lat: 0, lng: 0 })
  }),
  icon: jasmine.createSpy('icon').and.returnValue({}),
  latLng: jasmine.createSpy('latLng').and.callFake((lat: number, lng: number) => ({ lat, lng })),
  latLngBounds: jasmine.createSpy('latLngBounds').and.callFake((coords: any) => ({
    extend: jasmine.createSpy('extend').and.returnValue({}),
    getNorth: jasmine.createSpy('getNorth').and.returnValue(1),
    getSouth: jasmine.createSpy('getSouth').and.returnValue(-1),
    getEast: jasmine.createSpy('getEast').and.returnValue(1),
    getWest: jasmine.createSpy('getWest').and.returnValue(-1)
  })),
  control: {
    zoom: jasmine.createSpy('zoom').and.returnValue({
      addTo: jasmine.createSpy('addTo').and.returnValue({})
    }),
    attribution: jasmine.createSpy('attribution').and.returnValue({
      addTo: jasmine.createSpy('addTo').and.returnValue({})
    })
  },
  markerClusterGroup: jasmine.createSpy('markerClusterGroup').and.returnValue({
    addLayer: jasmine.createSpy('addLayer'),
    removeLayer: jasmine.createSpy('removeLayer'),
    clearLayers: jasmine.createSpy('clearLayers'),
    hasLayer: jasmine.createSpy('hasLayer').and.returnValue(false)
  }),
  DomUtil: {
    create: jasmine.createSpy('create').and.returnValue(document.createElement('div'))
  },
  DomEvent: {
    disableClickPropagation: jasmine.createSpy('disableClickPropagation')
  }
};

// Mock for AG Grid
class MockAgGridAngular {
  api = {
    setRowData: jasmine.createSpy('setRowData'),
    sizeColumnsToFit: jasmine.createSpy('sizeColumnsToFit'),
    setQuickFilter: jasmine.createSpy('setQuickFilter'),
    getSelectedRows: jasmine.createSpy('getSelectedRows').and.returnValue([])
  };
  columnDefs = [];
  rowData = [];
  gridReady = { emit: jasmine.createSpy('emit') };
  rowSelected = { emit: jasmine.createSpy('emit') };
}

// Register the mock for AG Grid
TestBed.configureTestingModule({
  providers: [
    { provide: 'AgGridAngular', useClass: MockAgGridAngular }
  ]
});

// Global mocks for browser APIs
Object.defineProperty(window, 'CSS', { value: null });
Object.defineProperty(window, 'getComputedStyle', {
  value: () => {
    return {
      display: 'none',
      appearance: ['-webkit-appearance']
    };
  }
});
Object.defineProperty(document, 'doctype', {
  value: '<!DOCTYPE html>'
});
Object.defineProperty(document.body.style, 'transform', {
  value: () => {
    return {
      enumerable: true,
      configurable: true
    };
  }
});