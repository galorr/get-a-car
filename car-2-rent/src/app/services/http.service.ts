import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { environment } from '../../environments/environment';
import {
  RetryConfig,
  DEFAULT_RETRY_CONFIG,
  DEFAULT_HEADERS,
  ApiError
} from '../models/api.model';

@Injectable({
  providedIn: 'root'
})
export class HttpService {
  private http = inject(HttpClient);
  private baseUrl = environment.apiUrl;
  private retryConfig: RetryConfig = DEFAULT_RETRY_CONFIG;

  /**
   * Configure retry behavior for failed requests
   */
  configureRetry(config: Partial<RetryConfig>): void {
    this.retryConfig = { ...this.retryConfig, ...config };
  }

  /**
   * Get the current retry configuration
   */
  getRetryConfig(): RetryConfig {
    return { ...this.retryConfig };
  }

  /**
   * Perform a GET request
   */
  get<T>(url: string, options: {
    params?: Record<string, string | number | boolean | ReadonlyArray<string | number | boolean>>,
    headers?: Record<string, string>
  } = {}): Observable<T> {
    const fullUrl = this.getFullUrl(url);
    const httpOptions = this.prepareRequestOptions(options);

    return this.http.get<T>(fullUrl, httpOptions).pipe(
      this.applyRetryStrategy(),
      catchError(error => this.handleError(error))
    );
  }

  /**
   * Perform a POST request
   */
  post<T>(url: string, body: any, options: {
    params?: Record<string, string | number | boolean | ReadonlyArray<string | number | boolean>>,
    headers?: Record<string, string>
  } = {}): Observable<T> {
    const fullUrl = this.getFullUrl(url);
    const httpOptions = this.prepareRequestOptions(options);

    return this.http.post<T>(fullUrl, body, httpOptions).pipe(
      this.applyRetryStrategy(),
      catchError(error => this.handleError(error))
    );
  }

  /**
   * Perform a PUT request
   */
  put<T>(url: string, body: any, options: {
    params?: Record<string, string | number | boolean | ReadonlyArray<string | number | boolean>>,
    headers?: Record<string, string>
  } = {}): Observable<T> {
    const fullUrl = this.getFullUrl(url);
    const httpOptions = this.prepareRequestOptions(options);

    return this.http.put<T>(fullUrl, body, httpOptions).pipe(
      this.applyRetryStrategy(),
      catchError(error => this.handleError(error))
    );
  }

  /**
   * Perform a DELETE request
   */
  delete<T>(url: string, options: {
    params?: Record<string, string | number | boolean | ReadonlyArray<string | number | boolean>>,
    headers?: Record<string, string>
  } = {}): Observable<T> {
    const fullUrl = this.getFullUrl(url);
    const httpOptions = this.prepareRequestOptions(options);

    return this.http.delete<T>(fullUrl, httpOptions).pipe(
      this.applyRetryStrategy(),
      catchError(error => this.handleError(error))
    );
  }

  /**
   * Perform a PATCH request
   */
  patch<T>(url: string, body: any, options: {
    params?: Record<string, string | number | boolean | ReadonlyArray<string | number | boolean>>,
    headers?: Record<string, string>
  } = {}): Observable<T> {
    const fullUrl = this.getFullUrl(url);
    const httpOptions = this.prepareRequestOptions(options);

    return this.http.patch<T>(fullUrl, body, httpOptions).pipe(
      this.applyRetryStrategy(),
      catchError(error => this.handleError(error))
    );
  }

  /**
   * Create pagination parameters
   */
  createPaginationParams(params: {
    page: number;
    limit: number;
    sortBy?: string;
    sortDirection?: 'asc' | 'desc';
  }): Record<string, string> {
    const httpParams: Record<string, string> = {
      page: params.page.toString(),
      limit: params.limit.toString()
    };

    if (params.sortBy) {
      httpParams['sortBy'] = params.sortBy;
    }

    if (params.sortDirection) {
      httpParams['sortDirection'] = params.sortDirection;
    }

    return httpParams;
  }

  /**
   * Get the full URL by combining the base URL with the endpoint
   */
  private getFullUrl(url: string): string {
    // If the URL already starts with http, assume it's a full URL
    if (url.startsWith('http')) {
      return url;
    }

    // Otherwise, combine with the base URL
    return `${this.baseUrl}${url}`;
  }

  /**
   * Prepare HTTP request options
   */
  private prepareRequestOptions(options: {
    params?: Record<string, string | number | boolean | ReadonlyArray<string | number | boolean>>,
    headers?: Record<string, string>
  }): {
    headers: Record<string, string>,
    params: Record<string, string | string[]>
  } {
    // Prepare headers
    const headers = {
      ...DEFAULT_HEADERS,
      ...options.headers
    };

    // Prepare params
    let params: Record<string, string | string[]> = {};
    if (options.params) {
      Object.entries(options.params).forEach(([key, value]) => {
        if (Array.isArray(value)) {
          params[key] = value.map(v => v.toString());
        } else {
          params[key] = value.toString();
        }
      });
    }

    return { headers, params };
  }

  /**
   * Apply retry strategy for failed requests
   */
  private applyRetryStrategy<T>() {
    return (source: Observable<T>) => {
      return source.pipe(
        catchError((error, caught) => {
          const { maxRetries, retryableStatusCodes } = this.retryConfig;

          // Only retry for specific status codes and up to maxRetries
          if (
            error.status &&
            retryableStatusCodes.includes(error.status) &&
            error.retryCount < maxRetries
          ) {

            // Add or increment retry count
            error.retryCount = (error.retryCount || 0) + 1;

            // Use exponential backoff
            const delay = this.retryConfig.delayMs * Math.pow(2, error.retryCount - 1);
            return new Observable<T>(observer => {
              setTimeout(() => {
                caught.subscribe(observer);
              }, delay);
            });
          }

          // If we've reached max retries or it's not a retryable error, don't retry
          return throwError(() => error);
        })
      );
    };
  }

  /**
   * Handle HTTP errors
   */
  private handleError(error: any): Observable<never> {
    let apiError: ApiError;

    if (error.error instanceof ErrorEvent) {
      // Client-side error
      apiError = {
        code: 'CLIENT_ERROR',
        message: 'A client-side error occurred',
        details: error.error.message
      };
      console.error('Client error:', error.error.message);
    } else {
      // Server-side error
      apiError = {
        code: error.status?.toString() || 'UNKNOWN',
        message: error.statusText || 'Unknown error',
        details: error.error
      };
      console.error(
        `Server error: ${error.status} ${error.statusText}`,
        error.error
      );
    }

    // Return an observable with a user-facing error message
    return throwError(() => apiError);
  }
}
