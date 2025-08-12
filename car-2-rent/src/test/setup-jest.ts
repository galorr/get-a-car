import 'zone.js';
import 'zone.js/testing';
import { getTestBed } from '@angular/core/testing';
import {
  BrowserDynamicTestingModule,
  platformBrowserDynamicTesting
} from '@angular/platform-browser-dynamic/testing';

// First, initialize the Angular testing environment
getTestBed().initTestEnvironment(
  BrowserDynamicTestingModule,
  platformBrowserDynamicTesting()
);

// Add Jasmine compatibility for Jest
// This helps with migrating from Jasmine to Jest
declare global {
  namespace jasmine {
    interface Matchers<T> {
      toBeTrue(): void;
      toBeFalse(): void;
    }
    // Add SpyObj type for compatibility
    type SpyObj<T> = jest.Mocked<T>;
  }
}

// Add Jasmine-style matchers to Jest
expect.extend({
  toBeTrue(received) {
    return {
      message: () => `Expected ${received} to be true`,
      pass: received === true
    };
  },
  toBeFalse(received) {
    return {
      message: () => `Expected ${received} to be false`,
      pass: received === false
    };
  }
});

// Add spyOnProperty function for Jest
(global as any).spyOnProperty = (obj: any, propName: string) => {
  const descriptor = Object.getOwnPropertyDescriptor(obj, propName);
  if (descriptor && descriptor.get) {
    return jest.spyOn(obj, propName, 'get');
  }
  return jest.spyOn(obj, propName);
};

// Mock for window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(), // deprecated
    removeListener: jest.fn(), // deprecated
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});

// Mock for ResizeObserver
(global as any).ResizeObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
}));

// Mock for IntersectionObserver
(global as any).IntersectionObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
}));

// Mock for CSS.supports
(global as any).CSS = {
  supports: jest.fn().mockImplementation(() => false),
};

// Mock for HTMLCanvasElement.getContext
HTMLCanvasElement.prototype.getContext = jest.fn();

// Mock for URL.createObjectURL
Object.defineProperty(URL, 'createObjectURL', {
  writable: true,
  value: jest.fn().mockImplementation(() => 'mock-url'),
});

// Mock for URL.revokeObjectURL
Object.defineProperty(URL, 'revokeObjectURL', {
  writable: true,
  value: jest.fn(),
});
