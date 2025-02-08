import { Component, OnInit } from '@angular/core';
import { UserService } from '../../../services/user.service';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { initFlowbite } from 'flowbite';
import { SweetalertService } from '../../../components/alerts/sweet-alert.service';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './register.component.html',
})
export default class RegisterComponent implements OnInit {
  userData = {
    email: '',
    password: '',
    name: '',
    lastName: ''
  };

  formErrors = {
    email: '',
    password: '',
    name: '',
    lastName: ''
  };

  showErrors = false;

  constructor(private userService: UserService, private router: Router, private sweetalertService: SweetalertService) { }

  ngOnInit(): void {
    initFlowbite();
  }

  validateForm(): boolean {
    let isValid = true;
    this.formErrors = {
      email: '',
      password: '',
      name: '',
      lastName: ''
    };

    // Validar nombre
    if (!this.userData.name.trim()) {
      this.formErrors.name = 'El nombre es requerido';
      isValid = false;
    }

    // Validar apellido
    if (!this.userData.lastName.trim()) {
      this.formErrors.lastName = 'El apellido es requerido';
      isValid = false;
    }

    // Validar email
    //const emailRegex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,6}$/;
    const emailRegex = /^[a-zA-Z0-9][a-zA-Z0-9._-]*[a-zA-Z0-9]@espe\.edu\.ec$/;
    const hasTwoConsecutiveDots = /\.{2,}/.test(this.userData.email);

    if (!this.userData.email.trim()) {
      this.formErrors.email = 'El correo electrónico es requerido';
      isValid = false;
    } else if (hasTwoConsecutiveDots) {
      this.formErrors.email = 'El correo no puede contener puntos consecutivos';
      isValid = false;
    } else if (!emailRegex.test(this.userData.email)) {
      this.formErrors.email = 'Ingrese un correo institucional válido (@espe.edu.ec)';
      isValid = false;
    }

    // Validar contraseña
    if (!this.userData.password) {
      this.formErrors.password = 'La contraseña es requerida';
      isValid = false;
    } else if (this.userData.password.length < 6) {
      this.formErrors.password = 'La contraseña debe tener al menos 6 caracteres';
      isValid = false;
    }

    return isValid;
  }

  // Método para manejar el registro de usuario
  onSubmit(): void {
    this.showErrors = true;

    if (!this.validateForm()) {
      this.sweetalertService.error('Por favor, complete todos los campos correctamente.');
      return;
    }

    const userData = {
      email: this.userData.email,
      password: this.userData.password,
      name: this.userData.name,
      lastName: this.userData.lastName
    };

    this.userService.register(userData).subscribe({
      next: (response) => {
        this.sweetalertService.success('Registro exitoso. Por favor, inicia sesión.');
        this.router.navigate(['/login']);
      },
      error: (error) => {
        const errorMessage = error.error?.message || 'Hubo un problema al registrar el usuario. Por favor, intenta nuevamente.';
        this.sweetalertService.error(errorMessage);
      }
    });
  }
}
