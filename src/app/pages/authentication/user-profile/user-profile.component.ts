import { Component, OnInit } from '@angular/core';
import { UserService } from '../../../services/user.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Image } from 'primeng/image';
import { SweetalertService } from '../../../components/alerts/sweet-alert.service';
import { environment } from '../../../../environments/environment';

@Component({
  selector: 'app-user-profile',
  standalone: true,
  imports: [CommonModule, FormsModule, Image],
  templateUrl: './user-profile.component.html',
})
export default class UserProfileComponent implements OnInit {

  public apiUrl = environment.apiUrl;

  user: any = {
    userId: '',
    name: '',
    lastName: '',
    email: '',
    imageUrl: '',
  };
  updatedData: any = { name: '', lastName: '', email: '', password: '' };
  selectedImage: File | null = null; 
  imagePreview: string | null = null;
  isEditing = false; 

  formErrors = {
    email: '',
    password: '',
    name: '',
    lastName: ''
  };

  constructor(private userService: UserService, private sweetalertService: SweetalertService  ) {}

  ngOnInit(): void {
    this.loadUserDetails();
  }

  // Validar el formulario antes de actualizar
  validateForm(): boolean {
    let isValid = true;
    this.formErrors = {
      email: '',
      password: '',
      name: '',
      lastName: ''
    };

    // Validar nombre
    if (!this.updatedData.name.trim()) {
      this.formErrors.name = 'El nombre es requerido';
      isValid = false;
    }

    // Validar apellido
    if (!this.updatedData.lastName.trim()) {
      this.formErrors.lastName = 'El apellido es requerido';
      isValid = false;
    }

    // Validar email
    const emailRegex = /^[a-zA-Z0-9][a-zA-Z0-9._-]*[a-zA-Z0-9]@espe\.edu\.ec$/;
    const hasTwoConsecutiveDots = /\.{2,}/.test(this.updatedData.email);

    if (!this.updatedData.email.trim()) {
      this.formErrors.email = 'El correo electrónico es requerido';
      isValid = false;
    } else if (hasTwoConsecutiveDots) {
      this.formErrors.email = 'El correo no puede contener puntos consecutivos';
      isValid = false;
    } else if (!emailRegex.test(this.updatedData.email)) {
      this.formErrors.email = 'Ingrese un correo institucional válido (@espe.edu.ec)';
      isValid = false;
    }

    // Validar contraseña solo si se ha proporcionado una
    if (this.updatedData.password) {
      if (this.updatedData.password.length < 6) {
        this.formErrors.password = 'La contraseña debe tener al menos 6 caracteres';
        isValid = false;
      }
    }

    return isValid;
  }

  loadUserDetails(): void {
    this.userService.getUserDetails().subscribe({
      next: (data) => {
        this.user = {
          userId: data.id || data.userId, 
          name: data.name || 'No disponible',
          lastName: data.lastName || 'No disponible',
          email: data.email || 'No disponible',
          imageUrl: data.imageUrl || `${this.apiUrl}/assets/default-user.png`,
        };
        this.updatedData.name = this.user.name;
        this.updatedData.lastName = this.user.lastName;
        this.updatedData.email = this.user.email;
      },
      error: (err) => {
        console.error('Error al obtener los detalles del usuario:', err);
      },
    });
  }

  // Capturar la imagen seleccionada
  onImageSelected(event: any): void {
    const file = event.target.files[0];

    if (!file.type.match(/image\/(jpeg|jpg|png)/)) {
      this.sweetalertService.error('Solo se permiten imágenes en formato JPEG, JPG o PNG.');
      return;
    }

    if (event.target.files.length > 1) {
      this.sweetalertService.error('Solo puedes seleccionar una imagen a la vez.');
      return;
    }

    this.selectedImage = file;

    const reader = new FileReader();
    reader.onload = (e: any) => {
      this.imagePreview = e.target.result;
    };
    reader.readAsDataURL(file);
  }  

  // Actualizar datos del usuario
  updateUser(): void {
    if (!this.validateForm()) {
      this.sweetalertService.error('Por favor, corrija los errores en el formulario antes de continuar.');
      return;
    }

    const formData = new FormData();
    formData.append('name', this.updatedData.name);
    formData.append('lastName', this.updatedData.lastName);
    formData.append('email', this.updatedData.email);
    if (this.updatedData.password) {
      formData.append('password', this.updatedData.password);
    }
    if (this.selectedImage) {
      formData.append('image', this.selectedImage);
    }

    this.userService.updateUser(this.user.userId, formData).subscribe({
      next: (response) => {
        this.sweetalertService.success('Usuario actualizado exitosamente');
        this.loadUserDetails();
        this.isEditing = false;
      },
      error: (error) => {
        const errorMessage = error.error?.message || 'Ocurrió un error al actualizar los datos';
        this.sweetalertService.error(errorMessage);
      },
    });
  }

  // Entrar en modo de edición
  startEditing(): void {
    this.isEditing = true;
  }

  // Guardar cambios y actualizar usuario
  saveChanges(): void {
    this.updateUser();
  }

  // Cancelar la edición
  cancelEditing(): void {
    this.isEditing = false;
    this.updatedData.name = this.user.name;
    this.updatedData.lastName = this.user.lastName;
    this.updatedData.email = this.user.email;
    this.updatedData.password = '';
    this.selectedImage = null;
    this.imagePreview = this.user.selectedImage; 
  }
}
