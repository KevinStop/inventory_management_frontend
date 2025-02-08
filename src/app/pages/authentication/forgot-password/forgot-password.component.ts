import { Component } from '@angular/core';
import { UserService } from '../../../services/user.service';
import { Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-forgot-password',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule, RouterLink
  ],
  templateUrl: './forgot-password.component.html',
})
export default class ForgotPasswordComponent {
  email: string = '';
  isLoading: boolean = false;

  constructor(
    private userService: UserService,
    private router: Router
  ) { }

  onSubmit(): void {
    if (!this.email || !this.userService.validateEmail(this.email)) {
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Por favor, ingrese un correo electrónico válido',
        confirmButtonText: 'Aceptar'
      });
      return;
    }

    this.isLoading = true;
    this.userService.requestPasswordReset(this.email).subscribe({
      next: () => {
        Swal.fire({
          icon: 'success',
          title: '¡Correo enviado!',
          text: 'Se han enviado las instrucciones de recuperación a tu correo electrónico',
          confirmButtonText: 'Aceptar'
        }).then(() => {
          this.router.navigate(['/login']);
        });
      },
      error: (error) => {
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: error.message || 'Ha ocurrido un error al procesar tu solicitud',
          confirmButtonText: 'Aceptar'
        });
      },
      complete: () => {
        this.isLoading = false;
      }
    });
  }
}