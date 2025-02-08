import { Component, OnInit } from '@angular/core';
import { FormsModule, FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { initFlowbite } from 'flowbite';
import { ComponentService, ComponentResponse  } from '../../../services/component.service';
import { CategoryService } from '../../../services/category.service';
import { SweetalertService } from '../../../components/alerts/sweet-alert.service';
import { environment } from '../../../../environments/environment';
import { Image } from 'primeng/image';

@Component({
  selector: 'app-electronic-component',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, Image],
  templateUrl: './electronic-component.component.html',
})
export default class ElectronicComponentComponent implements OnInit {

  public apiUrl = environment.apiUrl;

  activeFilters = {
    status: null as string | null,
    categories: [] as number[],
    searchTerm: '' as string
  };

  components: ComponentResponse[] = [];
  selectedImage: File | undefined = undefined;
  imagePreviewUrl: string | undefined = undefined;
  searchTerm: string = '';
  selectedCategories: number[] = [];
  categories: any[] = [];
  newCategory: any = { name: '' };
  selectedCategory: any = { name: '' };
  isModalOpen: boolean = false;
  selectedStatus: string | null = null;
  deleteItemType: string = '';
  isEditingCategory: boolean = false;
  updateForm: FormGroup;
  categoryForm: FormGroup;
  currentImageUrl: string | undefined;

  constructor(private componentService: ComponentService, private categoryService: CategoryService, private sweetalertService: SweetalertService,
    private formBuilder: FormBuilder,
  ) {
    this.updateForm = this.formBuilder.group({
      id: [null],
      name: ['', [Validators.required, Validators.minLength(3)]],
      description: ['', [Validators.required]],
      categoryId: ['', [Validators.required]],
      isActive: [true, [Validators.required]]
    });
    this.categoryForm = this.formBuilder.group({
      name: ['', [Validators.required, Validators.minLength(3)]],
    });
  }

  ngOnInit(): void {
    initFlowbite();

    this.getCategories();
    this.getComponents();
  }

  // Método para obtener todos los componentes
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

  // Método para obtener todas las categorías
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
    this.activeFilters.searchTerm = this.searchTerm.trim();
    this.applyFilters();
  }

  onImageSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.selectedImage = input.files[0];
      const reader = new FileReader();
      reader.onload = () => {
        this.imagePreviewUrl = reader.result as string;
      };
      reader.readAsDataURL(this.selectedImage);
    } else {
      this.selectedImage = undefined;
      this.imagePreviewUrl = undefined;
    }
  }

  openModalForUpdate(component: any): void {
    this.updateForm.patchValue({
      id: component.id,
      name: component.name,
      description: component.description,
      categoryId: component.categoryId,
      isActive: component.isActive
    });
    console.log(component.imageUrl)
    // Añade esto para la imagen actual
    this.currentImageUrl = component.imageUrl ? 
      `${this.apiUrl}${component.imageUrl}` : 
      `${this.apiUrl}/assets/default-component.png`;
      
    this.imagePreviewUrl = undefined;
    this.selectedImage = undefined;
    this.isModalOpen = true;
  }

  updateComponent(): void {
    if (this.updateForm.invalid) {
      this.sweetalertService.error('Por favor, complete todos los campos correctamente.');
      return;
    }
  
    const updatedComponent = this.updateForm.value;
  
    if (!updatedComponent.id) {
      console.error('ID del componente no encontrado.');
      this.sweetalertService.error('Error al obtener el componente.');
      return;
    }
  
    this.componentService.updateComponent(updatedComponent.id, updatedComponent, this.selectedImage).subscribe(
      () => {
        this.getComponents();
        this.closeModal();
        this.sweetalertService.success('Componente actualizado satisfactoriamente.');
      },
      (error) => {
        console.error('Error al actualizar el componente:', error);
        this.sweetalertService.error('Hubo un error al intentar actualizar el componente.');
      }
    );
  } 

  openDeleteModal(id: number, isCategory: boolean): void {
    this.deleteItemType = isCategory ? 'esta categoría' : 'este componente';
    const message = `¿Estás seguro de que deseas eliminar ${this.deleteItemType}?`;

    this.sweetalertService.confirm(message).then((result) => {
      if (result.isConfirmed) {
        if (isCategory) {
          this.deleteCategory(id);
        } else {
          this.deleteComponent(id);
        }
      }
    });
  }

  deleteComponent(id: number): void {
    this.componentService.deleteComponent(id).subscribe(
      () => {
        this.components = this.components.filter((component) => component.id !== id);
        this.sweetalertService.success('Componente eliminado con éxito.');
      },
      (error) => {
        console.error('Error al eliminar el componente:', error);
        this.sweetalertService.error('Hubo un error al intentar eliminar el componente.');
      }
    );
  }

  onCategoryChange(event: any): void {
    const categoryId = parseInt(event.target.value);    
    if (event.target.checked) {
      this.activeFilters.categories.push(categoryId);
    } else {
      this.activeFilters.categories = this.activeFilters.categories.filter(id => id !== categoryId);
    }
    this.applyFilters();
  }
  
  getFilteredComponents(): void {
    if (this.selectedCategories.length > 0) {
      this.componentService.filterComponentsByCategories(this.selectedCategories).subscribe(
        (response) => {
          this.components = response.components;
        },
        (error) => {
          console.error('Error al obtener los componentes filtrados', error);
        }
      );
    } else {
      this.getComponents();
    }
  }

  closeModal(): void {
    this.isModalOpen = false;
    this.updateForm.reset();
    this.selectedImage = undefined;
    this.imagePreviewUrl = undefined;
  }

  // Método para crear la categoría
  createCategory(): void {
    if (this.categoryForm.invalid) {
      this.sweetalertService.error('El nombre de la categoría no puede estar vacío ni menor a 3 caracteres.');
      return;
    }

    const newCategory = this.categoryForm.value;

    this.categoryService.createCategory(newCategory).subscribe(
      (response) => {
        this.categories.push(response);
        this.sweetalertService.success('Categoría creada satisfactoriamente.');
        this.categoryForm.reset(); // Limpiar el formulario
      },
      (error) => {
        console.error('Error al crear la categoría:', error);
        this.sweetalertService.error('Hubo un error al intentar crear la categoría.');
      }
    );
  }

  // Método para manejar el cambio en el filtro de estado
  onStatusFilterChange(event: Event): void {
    const select = event.target as HTMLSelectElement;
    const selectedValue = select.value;

    this.activeFilters.status = selectedValue || null;
    this.applyFilters();
  }

  // Método para filtrar los componentes por estado (activo o inactivo)
  filterComponentsByStatus(status: string): void {
    if (status !== null) {
      this.componentService.filterComponentsByStatus(status).subscribe(
        (response) => {
          this.components = response.components;
        },
        (error) => {
          console.error('Error al filtrar componentes por estado:', error);
        }
      );
    } else {
      this.getComponents();
    }
  }

  // Eliminar categoría
  deleteCategory(id: number): void {
    this.categoryService.deleteCategory(id).subscribe(
      () => {
        this.categories = this.categories.filter((category) => category.id !== id);
        this.sweetalertService.success('Categoría eliminada con éxito.');
      },
      (error) => {
        console.error('Error al eliminar la categoría:', error);
        this.sweetalertService.error('Hubo un error al intentar eliminar la categoría.');
      }
    );
  }

  // Función para habilitar la edición del nombre de la categoría
  enableEditCategory(category: any): void {
    this.selectedCategory = { ...category };
    this.isEditingCategory = true;
  }

  // Función para guardar la categoría actualizada
  saveCategory(): void {
    this.categoryService.updateCategory(this.selectedCategory.id, this.selectedCategory).subscribe(
      (response) => {
        const index = this.categories.findIndex((category) => category.id === response.id);
        if (index !== -1) {
          this.categories[index] = response;
        }
        this.isEditingCategory = false;
      },
      (error) => {
        console.error('Error al actualizar la categoría:', error);
        alert('Hubo un error al intentar actualizar la categoría');
      }
    );
  }

  trackByFn(index: number, item: any): number {
    return item.id; 
  }

  applyFilters(): void {
    // Si no hay filtros activos, mostrar todos los componentes
    if (!this.activeFilters.status && 
        this.activeFilters.categories.length === 0 && 
        !this.activeFilters.searchTerm) {
      this.getComponents();
      return;
    }

    this.componentService.getComponents().subscribe(
      (response) => {
        let filteredComponents = response.components;

        // Aplicar filtro de estado
        if (this.activeFilters.status) {
          const isActive = this.activeFilters.status === 'activo';
          filteredComponents = filteredComponents.filter(comp => comp.isActive === isActive);
        }

        // Aplicar filtro de categorías
        if (this.activeFilters.categories.length > 0) {
          filteredComponents = filteredComponents.filter(comp => 
            this.activeFilters.categories.includes(comp.categoryId)
          );
        }

        // Aplicar filtro de búsqueda
        if (this.activeFilters.searchTerm) {
          const searchTerm = this.activeFilters.searchTerm.toLowerCase();
          filteredComponents = filteredComponents.filter(comp => 
            comp.name.toLowerCase().includes(searchTerm)
          );
        }

        this.components = filteredComponents;
      },
      (error) => {
        console.error('Error al aplicar filtros:', error);
      }
    );
  }

  // Método para resetear filtros
  resetFilters(): void {
    this.activeFilters = {
      status: null,
      categories: [],
      searchTerm: ''
    };
    this.searchTerm = '';
    this.selectedCategories = [];
    // Resetear el select de estado en el template
    const statusSelect = document.getElementById('price-from') as HTMLSelectElement;
    if (statusSelect) statusSelect.value = '';
    
    this.getComponents();
  }

}
