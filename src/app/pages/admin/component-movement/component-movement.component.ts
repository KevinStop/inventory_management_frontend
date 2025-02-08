import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Modal, initFlowbite } from 'flowbite';
import { ComponentService, ComponentResponse } from '../../../services/component.service';
import { ComponentMovementService } from '../../../services/component-movement.service';
import { CategoryService } from '../../../services/category.service';
import { SweetalertService } from '../../../components/alerts/sweet-alert.service';
import { environment } from '../../../../environments/environment';
import { Image } from 'primeng/image';

@Component({
  selector: 'app-component-movement',
  standalone: true,
  imports: [CommonModule, FormsModule, Image],
  templateUrl: './component-movement.component.html',
})
export default class ComponentMovementComponent implements OnInit, OnDestroy {

  public apiUrl = environment.apiUrl;

  components: ComponentResponse[] = [];
  categories: any[] = [];
  searchTerm: string = '';
  showComponentList: boolean = false;
  isAddingComponent: boolean = false;
  selectedType: string = 'Ingreso';
  showTypeDropdown: boolean = false;
  selectedComponent: any = null;
  quantity: number | null = null;
  reason: string = '';
  newComponent: any = { name: '', categoryId: '', quantity: null, description: '', isActive: false };
  successMessage: string = '';
  successModal?: Modal;
  selectedImage: File | undefined = undefined;
  imagePreviewUrl: string | undefined = undefined;
  showErrors: boolean = false;
  quantityValid: boolean = true;
  reasonValid: boolean = true;
  nameValid: boolean = true;
  categoryValid: boolean = true;
  quantityValid2: boolean = true;
  descriptionValid: boolean = true;
  imageValid: boolean = true;

  constructor(private componentService: ComponentService, private componentMovementService: ComponentMovementService,
    private categoryService: CategoryService, private sweetalertService: SweetalertService) { }

  ngOnInit(): void {
    initFlowbite();

    this.getComponents();
    this.getCategories();

    document.addEventListener('click', this.closeComponentListOnClickOutside.bind(this));
  }

  ngOnDestroy(): void {
    document.removeEventListener('click', this.closeComponentListOnClickOutside.bind(this));
  }

  closeComponentListOnClickOutside(event: Event): void {
    this.showComponentList = false;
  }

  getComponents(): void {
    this.componentService.getComponents().subscribe(
      (response) => {
        this.components = response.components;
      },
      (error) => {
        console.error('Error al obtener los componentes:', error);
      }
    );
  }

  getCategories(): void {
    this.categoryService.getCategories().subscribe(
      (data) => {
        this.categories = data;
      },
      (error) => {
        console.error('Error al obtener las categorías:', error);
      }
    );
  }

  searchComponents(): void {
    if (this.searchTerm.trim()) {
      this.componentService.searchComponentsByName(this.searchTerm).subscribe(
        (response) => {
          this.components = response.components;
        },
        (error) => {
          console.error('Error al buscar los componentes:', error);
        }
      );
    } else {
      this.getComponents();
    }
  }

  toggleComponentList(show: boolean): void {
    this.showComponentList = show;
  }

  selectComponent(component: any): void {
    this.selectedComponent = component;
    this.isAddingComponent = false;
    this.searchTerm = component.name;
    this.showComponentList = false;
  }

  toggleTypeDropdown(): void {
    this.showTypeDropdown = !this.showTypeDropdown;
  }

  selectType(type: string): void {
    this.selectedType = type;
    this.showTypeDropdown = false;
  }

  // Enviar el movimiento al backend
  async submitMovement(): Promise<void> {
    this.showErrors = true;

    if (!this.validateForm()) {
      return;
    }

    const movementType = this.selectedType.toLowerCase();
    const movement = {
      componentId: this.selectedComponent?.id,
      quantity: this.quantity,
      reason: this.reason,
      movementType: movementType
    };

    // Preparar el contenido HTML para la confirmación
    const confirmHTML = `
    <div class="flex flex-col items-center gap-3">
        <div class="w-24 h-24 rounded-lg overflow-hidden flex items-center justify-center bg-gray-100 dark:bg-gray-700">
            <img 
                src="${this.apiUrl}${this.selectedComponent?.imageUrl}" 
                alt="${this.selectedComponent?.name}"
                class="w-auto h-auto max-w-full max-h-full p-1"
                onerror="this.src='/assets/no-image.png'"
            />
        </div>
        <div class="text-left w-full">
            <p class="font-medium mb-1">Componente: ${this.selectedComponent?.name}</p>
            <p class="text-sm mb-1">Cantidad: ${this.quantity}</p>
            <p class="text-sm mb-1">Razón: ${this.reason}</p>
            <p class="text-sm">Tipo: ${movementType === 'ingreso' ? 'Ingreso' : 'Egreso'}</p>
        </div>
    </div>
`;

    try {
      const result = await this.sweetalertService.confirm(
        `¿Desea realizar este ${movementType}?`,
        confirmHTML
      );

      if (result.isConfirmed) {
        // Mostrar loading
        this.sweetalertService.loading(`Procesando ${movementType}...`);

        this.componentMovementService.createComponentMovement(movement).subscribe({
          next: (response) => {
            this.sweetalertService.close(); // Cerrar loading
            this.sweetalertService.success(`Movimiento de ${movementType} realizado con éxito.`);
            this.resetForm();
            this.getComponents();
          },
          error: (error) => {
            this.sweetalertService.close(); // Cerrar loading
            const errorMessage = error.error?.error || 'Hubo un error al procesar el movimiento.';
            if (errorMessage.includes('razón del movimiento')) {
              this.sweetalertService.error('La razón del movimiento es obligatoria.');
            } else if (errorMessage === 'No hay un periodo académico activo disponible.') {
              this.sweetalertService.error(
                'No hay un periodo académico activo. Por favor, configúrelo antes de continuar.'
              );
            } else {
              this.sweetalertService.error(errorMessage);
            }
          }
        });
      }
    } catch (error) {
      console.error('Error en la confirmación:', error);
    }
  }

  // Resetear el formulario después de enviar
  resetForm(): void {
    this.quantity = null;
    this.reason = '';
    this.selectedComponent = null;
    this.searchTerm = '';
    this.selectedType = 'Ingreso';

    this.newComponent = {
      name: '',
      categoryId: '',
      quantity: null,
      description: '',
      isActive: false,
    };
    this.selectedImage = undefined;
    this.imagePreviewUrl = undefined;
    this.imageValid = true;

    this.showErrors = false;
  }

  createComponent(): void {
    this.showErrors = true;

    if (!this.validateForm2()) {
      this.sweetalertService.error('Por favor complete todos los campos obligatorios correctamente.');
      return;
    }

    // Sincronizar razón entre formularios
    if (this.reason.trim().length === 0) {
      this.sweetalertService.error('La razón del movimiento es obligatoria.');
      return;
    }

    // Añadir la razón al nuevo componente
    const newComponentData = {
      ...this.newComponent,
      reason: this.reason,
    };

    this.componentService.createComponent(newComponentData, this.selectedImage).subscribe(
      (response) => {
        this.successMessage = 'Componente y movimiento de ingreso creados satisfactoriamente.';
        this.sweetalertService.success(this.successMessage);

        this.isAddingComponent = false;
        this.getComponents();
        this.resetForm();
      },
      (error) => {
        const errorMessage = error.error?.error || 'Hubo un error al intentar crear el componente.';
        if (errorMessage.includes('razón del movimiento')) {
          this.sweetalertService.error('La razón del movimiento es obligatoria.');
        } else if (errorMessage === 'No hay un periodo académico activo disponible.') {
          this.sweetalertService.error(
            'No hay un periodo académico activo. Por favor, configúrelo antes de continuar.'
          );
        } else {
          this.sweetalertService.error(errorMessage);
        }
      }
    );
  }

  onImageSelected(event: Event): void {
    const input = event.target as HTMLInputElement;

    // Validar que se haya seleccionado un archivo
    if (!input.files || input.files.length === 0) {
      this.selectedImage = undefined;
      this.imagePreviewUrl = undefined;
      this.imageValid = false;
      this.sweetalertService.error('Debe seleccionar una imagen.');
      return;
    }

    const file = input.files[0];
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png'];

    // Validar el tipo de archivo
    if (!allowedTypes.includes(file.type)) {
      this.selectedImage = undefined;
      this.imagePreviewUrl = undefined;
      this.imageValid = false;
      this.sweetalertService.error('Solo se permiten archivos JPEG, JPG y PNG.');
      input.value = ''; // Limpiar el input
      return;
    }

    // Si pasa las validaciones
    this.selectedImage = file;
    this.imageValid = true;

    // Generar preview de la imagen
    const reader = new FileReader();
    reader.onload = () => {
      this.imagePreviewUrl = reader.result as string;
    };
    reader.readAsDataURL(this.selectedImage);
  }

  removeImage(): void {
    this.selectedImage = undefined;
    this.imagePreviewUrl = undefined;
  }

  openAddComponentForm(): void {
    this.isAddingComponent = true;
    this.selectedComponent = null;
    this.showComponentList = false;
    this.searchTerm = '';
  }

  // Validar individualmente los campos en cada cambio
  onQuantityChange(): void {
    if (!Number.isInteger(this.quantity)) {
      this.sweetalertService.error('La cantidad debe ser un número entero.');
      // Forzamos la actualización al valor anterior o a null
      setTimeout(() => {
        this.quantity = null;
      });
      this.quantityValid = false;
      return;
    }
    this.quantityValid = this.quantity !== null && this.quantity > 0;
  }

  onQuantityChange2(): void {
    if (!Number.isInteger(this.newComponent.quantity)) {
      this.sweetalertService.error('La cantidad debe ser un número entero.');
      // Forzamos la actualización al valor anterior o a null
      setTimeout(() => {
        this.newComponent.quantity = null;
      });
      this.quantityValid2 = false;
      return;
    }
    this.quantityValid2 = this.newComponent.quantity !== null && this.newComponent.quantity > 0;
  }

  onReasonChange(): void {
    this.reasonValid = this.reason.trim().length > 0;
  }

  // Método para validar el formulario completo
  private validateForm(): boolean {
    this.quantityValid = this.quantity !== null && this.quantity > 0;
    this.reasonValid = this.reason.trim().length > 0;

    return this.quantityValid && this.reasonValid;
  }

  // Métodos para validar individualmente
  onNameChange(): void {
    this.nameValid = this.newComponent.name.trim().length > 0;
  }

  onCategoryChange(): void {
    this.categoryValid = !!this.newComponent.categoryId;
  }

  onDescriptionChange(): void {
    this.descriptionValid = this.newComponent.description.trim().length > 0;
  }

  // Validación general del formulario
  private validateForm2(): boolean {
    this.nameValid = this.newComponent.name.trim().length > 0;
    this.categoryValid = !!this.newComponent.categoryId;
    this.quantityValid2 = this.newComponent.quantity !== null && this.newComponent.quantity > 0;
    this.descriptionValid = this.newComponent.description.trim().length > 0;
    this.reasonValid = this.reason.trim().length > 0;
    this.imageValid = !!this.selectedImage; // Validar que haya una imagen seleccionada

    // Si no hay imagen seleccionada y showErrors está activo, mostrar mensaje
    if (!this.imageValid && this.showErrors) {
      this.sweetalertService.error('Debe seleccionar una imagen.');
    }

    return this.nameValid &&
      this.categoryValid &&
      this.quantityValid2 &&
      this.descriptionValid &&
      this.reasonValid &&
      this.imageValid;
  }

}
