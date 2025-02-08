import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class ComponentMovementService {

  private apiUrl = `${environment.apiUrl}/component-movements`;

  constructor(private http: HttpClient) {}

  createComponentMovement(movement: any): Observable<any> {
    return this.http.post<any>(this.apiUrl, movement, { withCredentials: true });
  }

  getComponentMovements(filters: any = {}): Observable<any> {
    const params = new URLSearchParams();

    if (filters.componentId) {
      params.append('componentId', filters.componentId);
    }
    if (filters.movementType) {
      params.append('movementType', filters.movementType);
    }
    if (filters.startDate) {
      params.append('startDate', filters.startDate);
    }
    if (filters.endDate) {
      params.append('endDate', filters.endDate);
    }

    return this.http.get<any>(`${this.apiUrl}?${params.toString()}`, { withCredentials: true });
  }
}