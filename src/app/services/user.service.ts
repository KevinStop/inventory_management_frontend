import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, BehaviorSubject, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class UserService {
  private apiUrl = `${environment.apiUrl}/users`;
  private sessionExpiringSubject = new BehaviorSubject<boolean>(false);
  private expirationWarningTime = 5 * 60 * 1000; // 5 minutos

  constructor(private http: HttpClient, private router: Router) { }

  // Registro de usuario
  register(userData: any): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/register`, userData, { withCredentials: true });
  }

  // Login de usuario
  login(credentials: { email: string; password: string }): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/login`, credentials, { withCredentials: true });
  }

  // Obtener detalles del usuario autenticado
  getUserDetails(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/me`, { withCredentials: true });
  }

  // Extender sesión
  extendSession(): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/extend-session`, {}, { withCredentials: true });
  }

  // Logout del usuario
  logout(): void {
    this.http.post(`${this.apiUrl}/logout`, {}, { withCredentials: true }).subscribe({
      next: () => {
        localStorage.removeItem('selectedComponents'); 
        this.router.navigate(['/']); 
      },
      error: (err) => {
        console.error('Error al cerrar sesión:', err);
        localStorage.removeItem('selectedComponents'); 
      },
    });
  }

  // Verificar autenticación
  isAuthenticated(): Observable<boolean> {
    return this.http.get<boolean>(`${this.apiUrl}/authenticated`, { withCredentials: true });
  }

  // Obtener el tiempo restante de la sesión
  getRemainingTime(): Observable<number> {
    return this.http.get<{ remainingTime: number }>(`${this.apiUrl}/session-time`, { withCredentials: true }).pipe(
      map((response) => response.remainingTime),
      catchError(() => {
        console.error('Error al obtener el tiempo restante de la sesión.');
        return of(0); 
      })
    );
  }

  // Verificar si la sesión está por expirar
  checkSessionExpiration(): void {
    this.getRemainingTime().subscribe((remainingTime: number) => {
      if (remainingTime <= this.expirationWarningTime) {
        this.sessionExpiringSubject.next(true); 
      } else {
        this.sessionExpiringSubject.next(false);
      }
    });
  }

  // Iniciar el monitoreo de expiración de sesión
  startSessionExpirationCheck(): void {
    setInterval(() => this.checkSessionExpiration(), 1000); // Verificar cada segundo
  }

  // Observable para advertencias de sesión
  isSessionExpiring(): Observable<boolean> {
    return this.sessionExpiringSubject.asObservable();
  }

  // Actualizar datos del usuario
  updateUser(userId: number, formData: FormData): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/${userId}`, formData, { withCredentials: true });
  }

  // Método para obtener todos los usuarios con rol 'user'
  getAllUsers(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/all`, { withCredentials: true });
  }

  // Método para filtrar usuarios por nombre
  filterUsersByName(users: any[], searchTerm: string): any[] {
    if (!searchTerm) return users;
    searchTerm = searchTerm.toLowerCase();
    return users.filter(user =>
      user.name.toLowerCase().includes(searchTerm)
    );
  }

  requestPasswordReset(email: string): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/reset-password`, { email }, { 
      withCredentials: true 
    }).pipe(
      catchError(error => {
        // Manejar diferentes tipos de errores
        if (error.status === 404) {
          throw new Error('No existe ningún usuario registrado con este correo electrónico');
        }
        throw new Error('Error al procesar la solicitud de recuperación de contraseña');
      })
    );
  }

  // Método auxiliar para validar formato de email
  validateEmail(email: string): boolean {
    const emailRegex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,6}$/;
    return emailRegex.test(email);
  }

}
