import { Component, OnInit } from '@angular/core';
import { RequestService } from '../../services/request.service';
import { UserService } from '../../services/user.service';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { Router } from '@angular/router';
import { Image } from 'primeng/image';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, RouterLinkActive, Image],
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.css']
})
export class SidebarComponent implements OnInit {

  public apiUrl = environment.apiUrl;
  public ocsUrl = environment.ocsUrl;

  selectedComponentCount: number = 0;
  userRole: string | null = null; 
  user: any = {
    name: '',
    lastName:'',
    email: '',
    imageUrl: '', 
  };

  constructor(private userService: UserService, private router: Router, private requestService: RequestService) {}

  ngOnInit(): void {
    this.updateComponentCount();
    this.loadUserDetails();

    // Obtener el rol del usuario al inicializar el componente
    this.userService.getUserDetails().subscribe(
      (user) => {
        this.userRole = user.role;
      },
      (error) => {
        console.error('Error al obtener los detalles del usuario:', error);
        this.userRole = null;
      }
    );

    setInterval(() => {
      this.updateComponentCount();
    }, 1000);
  }

  // Método para actualizar el conteo de componentes
  updateComponentCount(): void {
    this.selectedComponentCount = this.requestService.getSelectedComponentCount();
  }

  // Método para cerrar sesión
  logout(): void {
    this.userService.logout();
    this.router.navigate(['/']);
  }

  // Métodos para verificar el rol
  isAdmin(): boolean {
    return this.userRole === 'admin';
  }

  isUser(): boolean {
    return this.userRole === 'user';
  }

  loadUserDetails(): void {
    this.userService.getUserDetails().subscribe({
      next: (data) => {
        this.user = {
          name: data.name || 'No disponible',
          lastName: data.lastName || 'No disponible',
          email: data.email || 'No disponible',
          imageUrl: data.imageUrl || `${this.apiUrl}/assets/default-user.png`, 
        };
      },
      error: (err) => {
        console.error('Error al obtener los detalles del usuario:', err);
      },
    });
  }
}
