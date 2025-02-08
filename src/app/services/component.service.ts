import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface AvailabilityDetails {
  total: number;
  available: number;
  inLoans: number;
  inRequests: number;
}

export interface ComponentResponse {
  id: number;
  name: string;
  description?: string;
  quantity: number;
  availableQuantity: number;
  availabilityDetails?: AvailabilityDetails;
  isActive: boolean;
  imageUrl?: string;
  categoryId: number;
  category: any;
  createdAt: Date;
  updatedAt: Date;
}

export interface ComponentsResponse {
  components: ComponentResponse[];
}

@Injectable({
  providedIn: 'root',
})
export class ComponentService {
  private apiUrl = `${environment.apiUrl}/components`;

  constructor(private http: HttpClient) {}

  // Obtener todos los componentes
  getComponents(includeAvailable: boolean = true): Observable<ComponentsResponse> {
    const params = new HttpParams().set('includeAvailable', includeAvailable.toString());
    return this.http.get<ComponentsResponse>(this.apiUrl, { 
      params,
      withCredentials: true 
    });
  }

  // Obtener un componente por ID
  getComponentById(id: number): Observable<ComponentResponse> {
    return this.http.get<ComponentResponse>(`${this.apiUrl}/${id}`, { 
      withCredentials: true 
    });
  }

  // Búsqueda por nombre
  searchComponentsByName(name: string, includeAvailable: boolean = true): Observable<ComponentsResponse> {
    const params = new HttpParams()
      .set('name', name)
      .set('includeAvailable', includeAvailable.toString());
    
    return this.http.get<ComponentsResponse>(this.apiUrl, { 
      params, 
      withCredentials: true 
    });
  }

  // Filtrar por categorías
  filterComponentsByCategories(categoryIds: number[]): Observable<ComponentsResponse> {
    const params = new HttpParams()
      .set('categoryIds', categoryIds.join(','));
    
    return this.http.get<ComponentsResponse>(`${this.apiUrl}/filter`, { 
      params,
      withCredentials: true 
    });
  }

  // Filtrar por estado
  filterComponentsByStatus(status: string, includeAvailable: boolean = true): Observable<ComponentsResponse> {
    const params = new HttpParams()
      .set('status', status)
      .set('includeAvailable', includeAvailable.toString());
    
    return this.http.get<ComponentsResponse>(this.apiUrl, { 
      params,
      withCredentials: true 
    });
  }

  // Los demás métodos mantienen su estructura original
  createComponent(component: any, imageFile?: File): Observable<ComponentResponse> {
    const formData = new FormData();
    formData.append('name', component.name);
    formData.append('categoryId', component.categoryId.toString());
    formData.append('quantity', component.quantity.toString());
    formData.append('reason', component.reason);
    if (component.description) formData.append('description', component.description);
    formData.append('isActive', component.isActive.toString());
    if (imageFile) formData.append('image', imageFile);

    return this.http.post<ComponentResponse>(this.apiUrl, formData, { 
      withCredentials: true 
    });
  }

  updateComponent(id: number, component: any, imageFile?: File): Observable<ComponentResponse> {
    const formData = new FormData();
    formData.append('name', component.name);
    formData.append('categoryId', component.categoryId.toString());
    if (component.description) formData.append('description', component.description);
    formData.append('isActive', component.isActive.toString());
    if (imageFile) formData.append('image', imageFile);

    return this.http.put<ComponentResponse>(`${this.apiUrl}/${id}`, formData, { 
      withCredentials: true 
    });
  }

  deleteComponent(id: number): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/${id}`, { 
      withCredentials: true 
    });
  }
}