import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { environment } from '../../environments/environment';
import { catchError, map } from 'rxjs/operators';

interface SelectedComponent {
  id: number;
  quantity: number;
  [key: string]: any;
}

@Injectable({
  providedIn: 'root',
})
export class RequestService {
  private apiUrl = `${environment.apiUrl}/requests`;
  private userId: number | null = null;

  constructor(private http: HttpClient) { }

  // Inicializar el servicio obteniendo el userId
  initialize(): void {
    this.http
      .get<any>(`${environment.apiUrl}/users/me`, { withCredentials: true })
      .pipe(
        map((user) => {
          this.userId = user.userId;
        }),
        catchError((error) => {
          console.error('Error al obtener los detalles del usuario:', error);
          this.userId = null;
          return of(null);
        })
      )
      .subscribe();
  }

  // Obtener todas las solicitudes por filtro (status, isActive, userId)
  getRequestsByFilter(filters: { status?: string; isActive?: boolean; userId?: number }): Observable<any> {
    const params: any = {};
    if (filters.status) params.status = filters.status;
    if (filters.isActive !== undefined) params.isActive = filters.isActive;
    if (filters.userId) params.userId = filters.userId;

    return this.http.get<any>(this.apiUrl, {
      withCredentials: true,
      params,
    });
  }

  // Obtener una solicitud por ID
  getRequestById(id: number): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/${id}`, { withCredentials: true });
  }

  // Método para crear una solicitud con validación de disponibilidad
  createRequest(requestData: any, requestDetails: any[], file?: File): Observable<any> {
    if (!this.userId) {
      console.error('Error: Usuario no autenticado');
      throw new Error('Usuario no autenticado');
    }

    const formData = new FormData();
    formData.append('userId', this.userId.toString());
    formData.append('description', requestData.description || '');
    formData.append('typeRequest', requestData.typeRequest || '');
    formData.append('returnDate', requestData.returnDate || '');
    formData.append('responsible', requestData.responsible || '');
    formData.append('status', requestData.status || 'pendiente');
    formData.append('requestDetails', JSON.stringify(requestDetails));
    if (file) formData.append('file', file, file.name);

    return this.http.post<any>(`${this.apiUrl}/`, formData, { 
      withCredentials: true 
    }).pipe(
      catchError(error => {
        if (error.error && error.error.error && error.error.error.includes('disponibilidad')) {
          // Manejar error específico de disponibilidad
          console.error('Error de disponibilidad:', error.error);
        }
        throw error;
      })
    );
  }

  // Aceptar o actualizar una solicitud
  updateRequest(id: number): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/${id}`, {}, { withCredentials: true });
  }

  // Eliminar una solicitud
  deleteRequest(id: number): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/${id}`, { withCredentials: true });
  }

  // Método para rechazo por admin
  rejectRequest(id: number, rejectionNotes: string): Observable<any> {
    return this.http.post<any>(
      `${this.apiUrl}/${id}/reject`, 
      { rejectionNotes }, 
      { withCredentials: true }
    );
  }

  // Actualizar la fecha de retorno (solicitar aplazo)
  updateReturnDate(id: number, newReturnDate: string): Observable<any> {
    return this.http.put<any>(
      `${this.apiUrl}/${id}/return-date`,
      { newReturnDate },
      { withCredentials: true }
    );
  }

  // Método para marcar una solicitud como no devuelta
  markAsNotReturned(id: number, adminNotes?: string): Observable<any> {
    const body = adminNotes ? { adminNotes } : {};
    return this.http.put<any>(
      `${this.apiUrl}/${id}/not-returned`, 
      body, 
      { withCredentials: true }
    );
  }

  // Método para obtener la lista de préstamos no devueltos
  getNotReturnedLoans(): Observable<any> {
    return this.http.get<any>(
      `${this.apiUrl}/not-returned`, 
      { withCredentials: true }
    );
  }

  // Modificar finalizeRequest para incluir la transición desde no_devuelto
  finalizeRequest(id: number, adminNotes?: string): Observable<any> {
    const body = adminNotes ? { adminNotes } : {};
    return this.http.put<any>(
      `${this.apiUrl}/${id}/finalize`,
      body,
      { withCredentials: true }
    );
  }

  // Opcional: Método helper para verificar si una solicitud puede marcarse como no devuelta
  canMarkAsNotReturned(request: any): boolean {
    return request.status === 'prestamo';
  }

  // Opcional: Método helper para verificar si una solicitud puede finalizarse
  canFinalize(request: any): boolean {
    return ['prestamo', 'no_devuelto'].includes(request.status);
  }

  // Obtener los componentes seleccionados desde localStorage
  getSelectedComponents(): SelectedComponent[] {
    const components = localStorage.getItem('selectedComponents');
    return components ? JSON.parse(components) : [];
  }

  // Almacenar los componentes seleccionados en localStorage
  setSelectedComponents(components: SelectedComponent[]): void {
    localStorage.setItem('selectedComponents', JSON.stringify(components));
  }

  // Obtener el número de componentes seleccionados (conteo total)
  getSelectedComponentCount(): number {
    const selectedComponents = this.getSelectedComponents();
    return selectedComponents.reduce(
      (total: number, component: SelectedComponent) => total + component.quantity,
      0
    );
  }

  // Método para agregar un componente validando la cantidad disponible
  addSelectedComponentToStorage(component: any, quantity: number): void {
    if (quantity > component.availableQuantity) {
      throw new Error(`La cantidad solicitada (${quantity}) excede la disponibilidad (${component.availableQuantity})`);
    }

    if (!this.userId) {
      this.http.get<any>(`${environment.apiUrl}/users/me`, { withCredentials: true })
        .pipe(
          map(user => {
            this.userId = user.userId;
            this.addComponentToLocalStorage(component, quantity);
          }),
          catchError(error => {
            console.error('Error al obtener el ID del usuario:', error);
            return of(null);
          })
        ).subscribe();
      return;
    }
    
    this.addComponentToLocalStorage(component, quantity);
  }

  private addComponentToLocalStorage(component: SelectedComponent, quantity: number): void {
    let selectedComponents = this.getSelectedComponents();
    const index = selectedComponents.findIndex((item: SelectedComponent) => item.id === component.id);
    if (index !== -1) {
      selectedComponents[index].quantity = quantity;
    } else {
      selectedComponents.push({ ...component, quantity });
    }
    this.setSelectedComponents(selectedComponents);
  }

  // Eliminar un componente de la lista seleccionada
  removeSelectedComponentFromStorage(componentId: number): void {
    let selectedComponents = this.getSelectedComponents();
    selectedComponents = selectedComponents.filter((item: SelectedComponent) => item.id !== componentId);
    this.setSelectedComponents(selectedComponents);
  }

  // request.service.ts
  getComprobante(url: string): Observable<Blob> {
    return this.http.get(url, {
      responseType: 'blob'
    });
  }
}
