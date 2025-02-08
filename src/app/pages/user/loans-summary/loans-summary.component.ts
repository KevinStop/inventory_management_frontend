import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormGroup, FormBuilder, Validators } from '@angular/forms';
import { RequestService } from '../../../services/request.service';
import { initFlowbite } from 'flowbite';
import { ImageModule } from 'primeng/image';
import { RouterLink } from '@angular/router';
import { SweetalertService } from '../../../components/alerts/sweet-alert.service';
import { ConfirmationService, MessageService } from 'primeng/api';
import { ToastModule } from 'primeng/toast';
import { environment } from '../../../../environments/environment';

@Component({
  selector: 'app-loans-summary',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, ImageModule, RouterLink, ToastModule],
  templateUrl: './loans-summary.component.html',
  providers: [MessageService, ConfirmationService],
})
export default class LoansSummaryComponent implements OnInit {

  public apiUrl = environment.apiUrl;

  formGroup: FormGroup;
  selectedComponents: any[] = [];
  totalAmount: number = 0;
  selectedFile: File | undefined = undefined;
  isSubmitting = false;

  constructor(
    private requestService: RequestService,
    private messageService: MessageService,
    private fb: FormBuilder,
    private sweetalertService: SweetalertService
  ) {
    this.formGroup = this.fb.group({
      typeRequest: ['', Validators.required],
      responsible: ['', Validators.required],
      returnDate: ['', [Validators.required, this.dateValidator]],
      comprobante: ['', Validators.required],
      description: [''],
    });
  }

  ngOnInit(): void {
    initFlowbite();
    this.loadSelectedComponents();
  }

  loadSelectedComponents(): void {
    this.selectedComponents = this.requestService.getSelectedComponents();
    this.calculateTotal();
  }

  hasSelectedComponents(): boolean {
    return this.selectedComponents.length > 0;
  }

  dateValidator(control: any): { [key: string]: boolean } | null {
    if (!control.value) {
      return null;
    }
    const today = new Date().toISOString().split('T')[0];
    const selectedDate = control.value;
    return selectedDate >= today ? null : { invalidDate: true };
  }

  updateQuantity(componentId: number, quantity: number): void {
    const component = this.selectedComponents.find((comp) => comp.id === componentId);
    if (!component) return;

    if (!Number.isInteger(quantity)) {
      this.sweetalertService.error('Solo se permiten números enteros.');
      this.loadSelectedComponents();
      return;
    }

    if (quantity <= 0) {
      this.sweetalertService.error('La cantidad no puede ser menor o igual a 0.');
      this.loadSelectedComponents();
      return;
    }

    if (quantity > component.availableQuantity) {
      this.sweetalertService.error(
        `La cantidad no puede exceder el máximo disponible (${component.availableQuantity}).`
      );
      this.loadSelectedComponents();
      return;
    }

    this.requestService.setSelectedComponents(this.selectedComponents);
    this.calculateTotal();
  }

  removeComponent(componentId: number): void {
    this.sweetalertService
      .confirm('¿Estás seguro de que deseas eliminar este componente?')
      .then((result) => {
        if (result.isConfirmed) {
          this.selectedComponents = this.selectedComponents.filter(
            (component) => component.id !== componentId
          );
          this.requestService.setSelectedComponents(this.selectedComponents);
          this.calculateTotal();
          this.messageService.add({
            severity: 'info',
            summary: 'Componente eliminado',
            detail: 'Se ha eliminado el componente de la solicitud',
            life: 2000,
          });
          return;
        }
      });
  }

  calculateTotal(): void {
    this.totalAmount = this.selectedComponents.reduce(
      (acc, component) => acc + (component.quantity || 0),
      0
    );
  }

  submitRequest(): void {
    // Validación del formulario
    if (this.formGroup.invalid) {
        this.formGroup.markAllAsTouched();
        this.sweetalertService.error('Debe completar todos los campos requeridos.');
        return;
    }

    // Validación de componentes seleccionados
    if (!this.hasSelectedComponents()) {
        this.sweetalertService.error('Debe seleccionar al menos un componente.');
        return;
    }

    const formData = {
        ...this.formGroup.value,
        selectedComponents: this.selectedComponents
            .filter((component) => component.quantity > 0)
            .map((component) => ({
                componentId: component.id,
                quantity: component.quantity,
            })),
    };

    if (formData.selectedComponents.length === 0) {
        this.sweetalertService.error('Debe seleccionar al menos un componente válido.');
        return;
    }

    // Mostrar alerta de carga
    this.sweetalertService.loading('Enviando solicitud...');
    this.isSubmitting = true;

    this.requestService.createRequest(formData, formData.selectedComponents, this.selectedFile).subscribe({
        next: (response) => {
            this.sweetalertService.close(); // Cerrar alerta de carga
            this.sweetalertService.success('Solicitud enviada correctamente.');
            this.selectedComponents = [];
            this.totalAmount = 0;
            this.formGroup.reset();
            this.requestService.setSelectedComponents([]);
        },
        error: (error) => {
            this.sweetalertService.close(); // Cerrar alerta de carga
            console.error('Error detallado al enviar la solicitud:', {
                error: error,
                status: error.status,
                message: error.message,
                formData: formData
            });
            this.sweetalertService.error('Error al enviar la solicitud.');
        },
        complete: () => {
            this.isSubmitting = false;
        }
    });
}

  onFileChange(event: any): void {
    const file = event.target.files[0];
    if (file) {
      const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg', 'application/pdf'];
      if (!allowedTypes.includes(file.type)) {
        this.sweetalertService.error('Solo se permiten archivos PNG, JPG, JPEG y PDF.');
        event.target.value = '';
      } else {
        this.selectedFile = file;
        this.formGroup.patchValue({ comprobante: file });
      }
    }
  }
}
