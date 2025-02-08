import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class AcademicPeriodsService {

  private apiUrl = `${environment.apiUrl}/academic-periods`;

  constructor(private http: HttpClient) {}

  // Obtener todos los periodos académicos
  getAcademicPeriods(): Observable<any> {
    return this.http.get<any>(this.apiUrl, { withCredentials: true });
  }

  // Obtener un periodo académico por ID
  getAcademicPeriodById(id: string): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/${id}`, { withCredentials: true });
  }

  // Crear un nuevo periodo académico
  createAcademicPeriod(academicPeriod: any): Observable<any> {
    return this.http.post<any>(this.apiUrl, academicPeriod, { withCredentials: true });
  }

  // Actualizar un periodo académico
  updateAcademicPeriod(id: string, academicPeriod: any): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/${id}`, academicPeriod, { withCredentials: true });
  }

  // Eliminar un periodo académico
  deleteAcademicPeriod(id: string): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/${id}`, { withCredentials: true });
  }

  activateAcademicPeriod(id: string): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/${id}/activate`, {}, { withCredentials: true });
  }
  
}