import { Component, OnInit } from '@angular/core';
import { initFlowbite } from 'flowbite';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ReportService } from '../../../services/report.service';
import { CategoryService } from '../../../services/category.service';
import { ComponentService, ComponentResponse } from '../../../services/component.service';
import { AcademicPeriodsService } from '../../../services/academic-periods.service';
import { TableModule } from 'primeng/table';
import { PaginatorModule } from 'primeng/paginator';
import { UserService } from '../../../services/user.service';

import Swal from 'sweetalert2';

interface PreviewResponse {
  headers: string[];
  data: any[];
}

@Component({
  selector: 'app-loans',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    TableModule,
    PaginatorModule
  ],
  templateUrl: './loans.component.html',
})
export default class LoansComponent implements OnInit {
  // Variables para el manejo de reportes
  availableReports: any[] = [];
  academicPeriods: any[] = [];
  previewData: any[] = [];
  components: ComponentResponse[] = [];
  categories: any[] = [];
  previewHeaders: string[] = [];
  selectedReport: string = '';
  filterForm: FormGroup;
  isLoading: boolean = false;
  showFilters: boolean = false;
  users: any[] = [];
  filteredUsers: any[] = [];
  searchTerm: string = '';

  // Definir tipos de filtros disponibles
  filterTypes = {
    date: ['startDate', 'endDate', 'returnDate'],
    select: ['status', 'movementType', 'category', 'componentId', 'academicPeriodId', 'userId'],
    number: ['']
  };

  constructor(
    private reportService: ReportService,
    private fb: FormBuilder,
    private categoryService: CategoryService,
    private componentService: ComponentService,
    private academicPeriodsService: AcademicPeriodsService,
    private userService: UserService
  ) {
    // Inicializar formulario vacío
    this.filterForm = this.fb.group({});
  }

  ngOnInit(): void {
    initFlowbite();
    this.getCategories();
    this.getComponents();
    this.loadAvailableReports();
    this.loadPeriods();
    this.loadUsers();
  }

  loadUsers(): void {
    this.userService.getAllUsers().subscribe({
      next: (data) => {
        this.users = data;
        this.filteredUsers = data;
      },
      error: (err) => console.error('Error cargando usuarios:', err)
    });
  }

  filterUsers(): void {
    this.filteredUsers = this.userService.filterUsersByName(this.users, this.searchTerm);
  }

  // Cargar períodos activos e inactivos
  loadPeriods(): void {
    this.academicPeriodsService.getAcademicPeriods().subscribe({
      next: (data) => {
        this.academicPeriods = data.academicPeriods;
      },
      error: (err) => {
        console.error('Error al cargar los períodos:', err);
      },
    });
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

  // Cargar los reportes disponibles
  loadAvailableReports(): void {
    this.reportService.getAvailableReports().subscribe({
      next: (response: any) => {
        this.availableReports = response.reports;
      },
      error: (error) => {
        console.error('Error cargando reportes:', error);
        this.showError('Error al cargar los reportes disponibles');
      }
    });
  }

  // Cuando se selecciona un tipo de reporte
  onReportTypeChange(event: Event): void {
    const value = (event.target as HTMLSelectElement).value;
    this.selectedReport = value;
    this.showFilters = true;
    this.initializeFilters(value);
    this.previewData = [];
    this.previewHeaders = [];
  }

  // Inicializar filtros según el tipo de reporte
  initializeFilters(reportId: string): void {
    const filterOptions = this.reportService.getFilterOptions(reportId);
    const formGroup: any = {};
  
    filterOptions.required?.forEach((filter: string) => {
      formGroup[filter] = ['', [Validators.required]];
    });
  
    filterOptions.optional?.forEach((filter: string) => {
      formGroup[filter] = [''];
    });
  
    this.filterForm = this.fb.group(formGroup, {
      validators: this.dateRangeValidator()
    });
  }

  isFieldInvalid(fieldName: string): boolean {
    const field = this.filterForm.get(fieldName);
    return field?.invalid && (field?.dirty || field?.touched) || false;
  }

  // Determinar el tipo de filtro
  getFilterType(filterName: string): string {
    for (const [type, filters] of Object.entries(this.filterTypes)) {
      if (filters.includes(filterName)) {
        return type;
      }
    }
    return 'text';
  }

  // Generar el reporte
  generateReport(): void {
    if (this.filterForm.invalid) {
      Object.keys(this.filterForm.controls).forEach(key => {
        const control = this.filterForm.get(key);
        if (control?.invalid) {
          control.markAsTouched();
        }
      });
      this.showError('Por favor complete todos los campos requeridos');
      return;
    }

    this.isLoading = true;
    const filters = this.filterForm.value;

    this.reportService.getReportPreview(this.selectedReport, filters).subscribe({
      next: (response: PreviewResponse) => {
        this.previewData = response.data;
        this.previewHeaders = response.headers;
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error obteniendo vista previa:', error);
        this.showError('Error al obtener vista previa de datos');
        this.isLoading = false;
      }
    });
  }

  generatePDF(): void {
    this.isLoading = true;
    const filters = this.filterForm.value;

    this.reportService.generateReport(this.selectedReport, filters).subscribe({
      next: (blob: Blob) => {
        const fileName = this.reportService.getReportFileName(this.selectedReport);
        this.reportService.downloadPDF(blob, fileName);
        this.showSuccess('Reporte PDF generado exitosamente');
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error generando PDF:', error);
        this.showError('Error al generar el PDF');
        this.isLoading = false;
      }
    });
  }

  // Reiniciar filtros
  resetFilters(): void {
    this.filterForm.reset();
  }

  // Mostrar mensaje de error
  private showError(message: string): void {
    Swal.fire({
      icon: 'error',
      title: 'Error',
      text: message
    });
  }

  // Mostrar mensaje de éxito
  private showSuccess(message: string): void {
    Swal.fire({
      icon: 'success',
      title: 'Éxito',
      text: message
    });
  }

  // Verificar si un filtro es requerido
  isFilterRequired(filterName: string): boolean {
    const filterOptions = this.reportService.getFilterOptions(this.selectedReport);
    return filterOptions.required?.includes(filterName) || false;
  }

  // Obtener el label para un filtro
  getFilterLabel(filterName: string): string {
    const labels: { [key: string]: string } = {
      startDate: 'Fecha inicial',
      endDate: 'Fecha final',
      academicPeriodId: 'Período académico',
      status: 'Estado',
      componentId: 'Componente',
      userId: 'Usuario',
      movementType: 'Tipo de movimiento',
      category: 'Categoría',
      returnDate: 'Fecha de devolución'
    };
    return labels[filterName] || filterName;
  }

  // En el componente TS añade este método
  getReportDescription(): string {
    const selectedReportObj = this.availableReports.find(r => r.id === this.selectedReport);
    return selectedReportObj ? selectedReportObj.description : '';
  }

  private dateRangeValidator(): any {
    return (formGroup: FormGroup) => {
      const startDate = formGroup.get('startDate')?.value;
      const endDate = formGroup.get('endDate')?.value;
  
      if (startDate && endDate) {
        const start = new Date(startDate);
        const end = new Date(endDate);
  
        if (end < start) {
          formGroup.get('endDate')?.setErrors({ dateRange: true });
          return { dateRange: true };
        } else {
          formGroup.get('endDate')?.setErrors(null);
          return null;
        }
      }
      return null;
    };
  }
}