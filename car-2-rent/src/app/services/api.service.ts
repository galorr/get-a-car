import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError, timer, of } from 'rxjs';
import { catchError, retry, mergeMap, retryWhen, delayWhen, take, concatMap } from 'rxjs/operators';
import { environment } from '../../environments/environment';
import { 
  ApiError, 
  RetryConfig, 
  DEFAULT_RETRY_CONFIG, 
  DEFAULT_HEADERS,
  PaginationParams
} from '../models/api.model';
import { CacheService } from './cache.service';

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  private http = inject(HttpClient);
  private cacheService = inject(CacheService);
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
    headers?: Record<string, string>,
    useCache?: boolean,
    cacheKey?: string
  } = {}): Observable<T> {
    const fullUrl = this.getFullUrl(url);
    const cacheKey = options.cacheKey || fullUrl;
    
    // Check cache if enabled
    if (options.useCache !== false) {
      const cachedData = this.cacheService.get<T>(cacheKey);
      if (cachedData) {
        return of(cachedData);
      }
    }
    
    // Prepare request options
    const httpOptions = this.prepareRequestOptions(options);
    
    return this.http.get<T>(fullUrl, httpOptions).pipe(
      this.applyRetryStrategy(),
      catchError(error => this.handleError(error)),
      mergeMap(response => {
        // Cache the response if caching is enabled
        if (options.useCache !== false) {
          this.cacheService.set(cacheKey, response);
        }
        return of(response);
      })
    );
  }

  /**
   * Perform a POST request
   */
  post<T>(url: string, body: any, options: {
    params?: Record<string, string | number | boolean | ReadonlyArray<string | number | boolean>>,
    headers?: Record<string, string>,
    invalidateCache?: boolean,
    cachePattern?: string
  } = {}): Observable<T> {
    const fullUrl = this.getFullUrl(url);
    const httpOptions = this.prepareRequestOptions(options);
    
    return this.http.post<T>(fullUrl, body, httpOptions).pipe(
      this.applyRetryStrategy(),
      catchError(error => this.handleError(error)),
      mergeMap(response => {
        // Invalidate cache if needed
        if (options.invalidateCache && options.cachePattern) {
          this.cacheService.removeByPattern(options.cachePattern);
        }
        return of(response);
      })
    );
  }

  /**
   * Perform a PUT request
   */
  put<T>(url: string, body: any, options: {
    params?: Record<string, string | number | boolean | ReadonlyArray<string | number | boolean>>,
    headers?: Record<string, string>,
    invalidateCache?: boolean,
    cachePattern?: string
  } = {}): Observable<T> {
    const fullUrl = this.getFullUrl(url);
    const httpOptions = this.prepareRequestOptions(options);
    
    return this.http.put<T>(fullUrl, body, httpOptions).pipe(
      this.applyRetryStrategy(),
      catchError(error => this.handleError(error)),
      mergeMap(response => {
        // Invalidate cache if needed
        if (options.invalidateCache && options.cachePattern) {
          this.cacheService.removeByPattern(options.cachePattern);
        }
        return of(response);
      })
    );
  }

  /**
   * Perform a DELETE request
   */
  delete<T>(url: string, options: {
    params?: Record<string, string | number | boolean | ReadonlyArray<string | number | boolean>>,
    headers?: Record<string, string>,
    invalidateCache?: boolean,
    cachePattern?: string
  } = {}): Observable<T> {
    const fullUrl = this.getFullUrl(url);
    const httpOptions = this.prepareRequestOptions(options);
    
    return this.http.delete<T>(fullUrl, httpOptions).pipe(
      this.applyRetryStrategy(),
      catchError(error => this.handleError(error)),
      mergeMap(response => {
        // Invalidate cache if needed
        if (options.invalidateCache && options.cachePattern) {
          this.cacheService.removeByPattern(options.cachePattern);
        }
        return of(response);
      })
    );
  }

  /**
   * Perform a PATCH request
   */
  patch<T>(url: string, body: any, options: {
    params?: Record<string, string | number | boolean | ReadonlyArray<string | number | boolean>>,
    headers?: Record<string, string>,
    invalidateCache?: boolean,
    cachePattern?: string
  } = {}): Observable<T> {
    const fullUrl = this.getFullUrl(url);
    const httpOptions = this.prepareRequestOptions(options);
    
    return this.http.patch<T>(fullUrl, body, httpOptions).pipe(
      this.applyRetryStrategy(),
      catchError(error => this.handleError(error)),
      mergeMap(response => {
        // Invalidate cache if needed
        if (options.invalidateCache && options.cachePattern) {
          this.cacheService.removeByPattern(options.cachePattern);
        }
        return of(response);
      })
    );
  }

  /**
   * Create pagination parameters
   */
  createPaginationParams(params: PaginationParams): HttpParams {
    let httpParams = new HttpParams()
      .set('page', params.page.toString())
      .set('limit', params.limit.toString());
    
    if (params.sortBy) {
      httpParams = httpParams.set('sortBy', params.sortBy);
    }
    
    if (params.sortDirection) {
      httpParams = httpParams.set('sortDirection', params.sortDirection);
    }
    
    return httpParams;
  }

  /**
   * Clear the entire cache
   */
  clearCache(): void {
    this.cacheService.clear();
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
    headers: HttpHeaders,
    params: HttpParams
  } {
    // Prepare headers
    const headers = new HttpHeaders({
      ...DEFAULT_HEADERS,
      ...options.headers
    });
    
    // Prepare params
    let params = new HttpParams();
    if (options.params) {
      Object.entries(options.params).forEach(([key, value]) => {
        if (Array.isArray(value)) {
          value.forEach(v => {
            params = params.append(key, v.toString());
          });
        } else {
          params = params.set(key, value.toString());
        }
      });
    }
    
    return { headers, params };
  }

  /**
   * Apply retry strategy for failed requests
   */
  private applyRetryStrategy<T>() {
    const { maxRetries, delayMs, retryableStatusCodes } = this.retryConfig;
    
    return retryWhen<T>(errors => 
      errors.pipe(
        concatMap((error, index) => {
          // Only retry for specific status codes and up to maxRetries
          if (
            index < maxRetries && 
            error instanceof HttpErrorResponse &&
            retryableStatusCodes.includes(error.status)
          ) {
            console.log(`Retrying request (${index + 1}/${maxRetries})...`);
            // Use exponential backoff
            const delay = delayMs * Math.pow(2, index);
            return of(error).pipe(delayWhen(() => timer(delay)));
          }
          
          // If we've reached max retries or it's not a retryable error, don't retry
          return throwError(() => error);
        })
      )
    );
  }

  /**
   * Handle HTTP errors
   */
  private handleError(error: HttpErrorResponse): Observable<never> {
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
        code: error.status.toString(),
        message: error.statusText,
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