import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { HttpService } from './http.service';
import {
  RetryConfig,
  PaginationParams
} from '../models/api.model';

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  private httpService = inject(HttpService);

  /**
   * Configure retry behavior for failed requests
   */
  configureRetry(config: Partial<RetryConfig>): void {
    this.httpService.configureRetry(config);
  }

  /**
   * Get the current retry configuration
   */
  getRetryConfig(): RetryConfig {
    return this.httpService.getRetryConfig();
  }

  /**
   * Perform a GET request
   */
  get<T>(url: string, options: {
    params?: Record<string, string | number | boolean | ReadonlyArray<string | number | boolean>>,
    headers?: Record<string, string>
  } = {}): Observable<T> {
    return this.httpService.get<T>(url, options);
  }

  /**
   * Perform a POST request
   */
  post<T>(url: string, body: any, options: {
    params?: Record<string, string | number | boolean | ReadonlyArray<string | number | boolean>>,
    headers?: Record<string, string>
  } = {}): Observable<T> {
    return this.httpService.post<T>(url, body, options);
  }

  /**
   * Perform a PUT request
   */
  put<T>(url: string, body: any, options: {
    params?: Record<string, string | number | boolean | ReadonlyArray<string | number | boolean>>,
    headers?: Record<string, string>
  } = {}): Observable<T> {
    return this.httpService.put<T>(url, body, options);
  }

  /**
   * Perform a DELETE request
   */
  delete<T>(url: string, options: {
    params?: Record<string, string | number | boolean | ReadonlyArray<string | number | boolean>>,
    headers?: Record<string, string>
  } = {}): Observable<T> {
    return this.httpService.delete<T>(url, options);
  }

  /**
   * Perform a PATCH request
   */
  patch<T>(url: string, body: any, options: {
    params?: Record<string, string | number | boolean | ReadonlyArray<string | number | boolean>>,
    headers?: Record<string, string>
  } = {}): Observable<T> {
    return this.httpService.patch<T>(url, body, options);
  }

  /**
   * Create pagination parameters
   */
  createPaginationParams(params: PaginationParams): Record<string, string> {
    return this.httpService.createPaginationParams(params);
  }
}
