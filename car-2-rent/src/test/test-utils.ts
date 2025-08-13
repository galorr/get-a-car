import { HttpClientTestingModule } from '@angular/common/http/testing';
import type { Type } from '@angular/core';
import type { ComponentFixture } from '@angular/core/testing';
import { TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { RouterTestingModule } from '@angular/router/testing';
import { Observable, of } from 'rxjs';

/**
 * Create a component fixture for testing
 * @param component Component class
 * @param providers Array of providers
 * @param declarations Array of declarations
 * @param imports Array of imports
 * @returns ComponentFixture
 */
export function createComponentFixture<T>(
  component: Type<T>,
  providers: any[] = [],
  declarations: any[] = [],
  imports: any[] = []
): ComponentFixture<T> {
  TestBed.configureTestingModule({
    imports: [
      RouterTestingModule,
      HttpClientTestingModule,
      NoopAnimationsModule,
      ...imports,
    ],
    declarations: [component, ...declarations],
    providers: [...providers],
  }).compileComponents();

  return TestBed.createComponent(component);
}

/**
 * Find an element in the fixture by CSS selector
 * @param fixture Component fixture
 * @param selector CSS selector
 * @returns Element
 */
export function findElement<T>(
  fixture: ComponentFixture<T>,
  selector: string
): HTMLElement {
  return fixture.debugElement.query(By.css(selector))?.nativeElement;
}

/**
 * Find all elements in the fixture by CSS selector
 * @param fixture Component fixture
 * @param selector CSS selector
 * @returns Array of elements
 */
export function findElements<T>(
  fixture: ComponentFixture<T>,
  selector: string
): HTMLElement[] {
  return fixture.debugElement
    .queryAll(By.css(selector))
    .map(el => el.nativeElement);
}

/**
 * Click an element in the fixture
 * @param fixture Component fixture
 * @param selector CSS selector
 */
export function click<T>(fixture: ComponentFixture<T>, selector: string): void {
  const element = findElement(fixture, selector);
  element.click();
  fixture.detectChanges();
}

/**
 * Set input value and dispatch input event
 * @param fixture Component fixture
 * @param selector CSS selector
 * @param value Input value
 */
export function setInputValue<T>(
  fixture: ComponentFixture<T>,
  selector: string,
  value: string
): void {
  const inputElement = findElement(fixture, selector) as HTMLInputElement;
  inputElement.value = value;
  inputElement.dispatchEvent(new Event('input'));
  fixture.detectChanges();
}

/**
 * Create a mock service
 * @param methods Object with method names as keys and return values as values
 * @returns Mock service
 */
export function createMockService(methods: Record<string, any>): any {
  const mockService: Record<string, any> = {};

  Object.entries(methods).forEach(([methodName, returnValue]) => {
    mockService[methodName] = jasmine.createSpy(methodName);

    if (returnValue instanceof Observable) {
      mockService[methodName].and.returnValue(returnValue);
    } else if (returnValue instanceof Promise) {
      mockService[methodName].and.returnValue(returnValue);
    } else if (typeof returnValue === 'function') {
      mockService[methodName].and.callFake(returnValue);
    } else {
      mockService[methodName].and.returnValue(of(returnValue));
    }
  });

  return mockService;
}

/**
 * Create a mock for HttpClient
 * @returns Mock HttpClient
 */
export function createMockHttpClient(): any {
  return {
    get: jasmine.createSpy('get').and.returnValue(of({})),
    post: jasmine.createSpy('post').and.returnValue(of({})),
    put: jasmine.createSpy('put').and.returnValue(of({})),
    delete: jasmine.createSpy('delete').and.returnValue(of({})),
    patch: jasmine.createSpy('patch').and.returnValue(of({})),
  };
}

/**
 * Create a mock for ActivatedRoute
 * @param params Route params
 * @param queryParams Query params
 * @param data Route data
 * @returns Mock ActivatedRoute
 */
export function createMockActivatedRoute(
  params: Record<string, string> = {},
  queryParams: Record<string, string> = {},
  data: Record<string, any> = {}
): any {
  return {
    params: of(params),
    queryParams: of(queryParams),
    data: of(data),
    snapshot: {
      params,
      queryParams,
      data,
    },
  };
}

/**
 * Create a mock for Router
 * @returns Mock Router
 */
export function createMockRouter(): any {
  return {
    navigate: jasmine
      .createSpy('navigate')
      .and.returnValue(Promise.resolve(true)),
    navigateByUrl: jasmine
      .createSpy('navigateByUrl')
      .and.returnValue(Promise.resolve(true)),
    createUrlTree: jasmine.createSpy('createUrlTree').and.returnValue({}),
    serializeUrl: jasmine.createSpy('serializeUrl').and.returnValue(''),
  };
}

/**
 * Load mock data from assets
 * @param path Path to mock data file
 * @returns Mock data
 */
export function loadMockData<T>(path: string): T {
  // In a real implementation, this would load the data from the file
  // For now, we'll just return an empty object
  return {} as T;
}
