import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, catchError, throwError } from 'rxjs';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  protected readonly baseUrl = environment.apiUrl;

  constructor(protected http: HttpClient) {}

  protected get<T>(endpoint: string, params?: Record<string, any>): Observable<T> {
    let httpParams = new HttpParams();
    
    if (params) {
      Object.keys(params).forEach(key => {
        if (params[key] !== undefined && params[key] !== null && params[key] !== '') {
          httpParams = httpParams.set(key, String(params[key]));
        }
      });
    }

    return this.http.get<T>(`${this.baseUrl}${endpoint}`, { params: httpParams })
      .pipe(catchError(this.handleError));
  }

  protected post<T>(endpoint: string, body: any): Observable<T> {
    return this.http.post<T>(`${this.baseUrl}${endpoint}`, body)
      .pipe(catchError(this.handleError));
  }

  protected put<T>(endpoint: string, body: any): Observable<T> {
    return this.http.put<T>(`${this.baseUrl}${endpoint}`, body)
      .pipe(catchError(this.handleError));
  }

  protected delete<T>(endpoint: string): Observable<T> {
    return this.http.delete<T>(`${this.baseUrl}${endpoint}`)
      .pipe(catchError(this.handleError));
  }

  private handleError(error: any): Observable<never> {
    let errorMessage = 'Une erreur est survenue';
    
    if (error.error instanceof ErrorEvent) {
      errorMessage = error.error.message;
    } else {
      switch (error.status) {
        case 400:
          errorMessage = 'Requête invalide';
          break;
        case 404:
          errorMessage = 'Ressource non trouvée';
          break;
        case 500:
          errorMessage = 'Erreur serveur';
          break;
        default:
          errorMessage = `Erreur ${error.status}: ${error.statusText}`;
      }
    }
    
    console.error('API Error:', error);
    return throwError(() => new Error(errorMessage));
  }
}
