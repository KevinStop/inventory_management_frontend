import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { initFlowbite } from 'flowbite';
import { RequestService } from '../../../services/request.service';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { SweetalertService } from '../../../components/alerts/sweet-alert.service';
import { UserService } from '../../../services/user.service';
import { environment } from '../../../../environments/environment';

@Component({
  selector: 'app-request',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './request.component.html',
})
export default class RequestComponent implements OnInit {

  public apiUrl = environment.apiUrl;
  
  requests: any[] = [];
  filteredRequests: any[] = [];
  selectedFilter: string = 'todo';
  isModalOpen = false;
  isProofModalOpen = false;
  modalDetails: any[] = [];
  proofUrl: SafeResourceUrl | null = null;
  pdfType: string = '';
  isLoading: boolean = false;
  adminNotes: string = '';
  isAdminNotesModalOpen: boolean = false;
  currentRequestId: number | null = null;
  notReturnedLoans: any[] = [];
  isRejectionAction: boolean = false;
  userRole: string = '';

  constructor(
    private requestService: RequestService,
    private sanitizer: DomSanitizer,
    private sweetalertService: SweetalertService,
    private userService: UserService,
  ) {}

  ngOnInit(): void {
    initFlowbite();
    this.fetchActiveRequests();
    this.userService.getUserDetails().subscribe(
      userDetails => this.userRole = userDetails
    );
    console.log()
  }

  fetchActiveRequests(): void {
    this.isLoading = true;
    this.requestService.getRequestsByFilter({ isActive: true }).subscribe({
      next: (data) => {
        this.requests = data;
        this.filterRequests();
        this.isLoading = false;
      },
      error: (err) => {
        this.isLoading = false;
        console.error('Error al obtener solicitudes activas:', err);
        this.sweetalertService.error('No se pudieron obtener las solicitudes activas.');
      }
    });
  }

  filterRequests(): void {
    if (this.selectedFilter === 'todo') {
      this.filteredRequests = this.requests.filter(
        (req) => req.status === 'pendiente' || req.status === 'prestamo' || req.status === 'no_devuelto'
      );
    } else {
      this.filteredRequests = this.requests.filter(
        (req) => req.status === this.selectedFilter
      );
    }
  }

  onFilterChange(event: Event): void {
    const target = event.target as HTMLSelectElement;
    this.selectedFilter = target.value;
    this.filterRequests();
  }

  openDetails(requestId: number): void {
    this.requestService.getRequestById(requestId).subscribe({
      next: (data) => {
        this.modalDetails = data.requestDetails.map((detail: any) => ({
          name: detail.component.name,
          description: detail.component.description,
          imageUrl: detail.component.imageUrl,
          quantity: detail.quantity,
          category: detail.component.category?.name || 'Sin categoría',
        }));
        this.isModalOpen = true;
      },
      error: (err) => {
        console.error('Error al obtener los detalles de la solicitud:', err);
        this.sweetalertService.error('No se pudieron obtener los detalles de la solicitud.');
      },
    });
  }

  closeModal(): void {
    this.isModalOpen = false;
    this.modalDetails = [];
  }

  openProof(proofUrl: string): void {
    const fullUrl = proofUrl.startsWith('http') ? proofUrl : `${this.apiUrl}${proofUrl}`;
    this.isLoading = true;

    if (fullUrl.toLowerCase().endsWith('.pdf')) {
      this.requestService.getComprobante(fullUrl).subscribe({
        next: (blob) => {
          const fileURL = URL.createObjectURL(blob);
          this.proofUrl = this.sanitizer.bypassSecurityTrustResourceUrl(fileURL);
          this.pdfType = 'pdf';
          this.isProofModalOpen = true;
          this.isLoading = false;
        },
        error: (error) => {
          console.error('Error al cargar el PDF:', error);
          this.sweetalertService.error('No se pudo cargar el comprobante.');
          this.isLoading = false;
        }
      });
    } else {
      this.proofUrl = this.sanitizer.bypassSecurityTrustResourceUrl(fullUrl);
      this.pdfType = 'image';
      this.isProofModalOpen = true;
      this.isLoading = false;
    }
  }

  closeProofModal(): void {
    if (this.proofUrl && this.pdfType === 'pdf') {
      const url = this.proofUrl.toString();
      URL.revokeObjectURL(url);
    }
    this.isProofModalOpen = false;
    this.proofUrl = null;
    this.pdfType = '';
  }

  acceptRequest(requestId: number): void {
    if (!requestId) {
      this.sweetalertService.error('ID de solicitud no válido');
      return;
    }
  
    this.sweetalertService.confirm('¿Estás seguro de que deseas aceptar esta solicitud?').then((result) => {
      if (result.isConfirmed) {
        this.requestService.updateRequest(requestId).subscribe({
          next: (response) => {
            this.sweetalertService.success('Solicitud aceptada con éxito');
            this.fetchActiveRequests();
          },
          error: (err) => {
            const errorMessage = err.error?.error || 'Error al aceptar la solicitud';
            if (errorMessage === 'No hay un periodo académico activo. No se puede aceptar la solicitud.') {
              this.sweetalertService.error(
                'No hay un periodo académico activo. Por favor, configúrelo antes de continuar.'
              );
            } else if (err.error?.stockErrors) {
              // Mantener la lógica existente para errores de stock
              const errorDetails = err.error.stockErrors.map((error: any) => 
                `• ${error.componentName}:\n` +
                `  - Cantidad solicitada: ${error.requestedQuantity}\n` +
                `  - Cantidad disponible: ${error.availableQuantity}`
              ).join('\n');
              
              this.sweetalertService.error(
                'Stock insuficiente',
                'Los siguientes componentes no tienen stock suficiente:\n\n' + errorDetails
              );
            } else {
              this.sweetalertService.error(errorMessage);
            }
          },
        });
      }
    });
  }

  rejectRequest(requestId: number): void {
    if (!requestId) {
      this.sweetalertService.error('ID de solicitud no válido');
      console.error('ID de solicitud no válido');
      return;
    }
  
    this.sweetalertService.confirm('Por favor, agregue el motivo del rechazo').then((result) => {
      if (result.isConfirmed) {
        this.currentRequestId = requestId;
        this.isAdminNotesModalOpen = true;
        this.isRejectionAction = true;
      }
    });
  }

  finalizeRequest(requestId: number): void {
    if (!requestId) {
      this.sweetalertService.error('ID de solicitud no válido');
      console.error('ID de solicitud no válido');
      return;
    }

    this.sweetalertService.confirm('¿Desea agregar alguna observación?').then((result) => {
      if (result.isConfirmed) {
        this.currentRequestId = requestId;
        this.isAdminNotesModalOpen = true;
      } else {
        this.confirmFinalizeRequest(requestId);
      }
    });
  }

  private confirmFinalizeRequest(requestId: number): void {
    this.sweetalertService.confirm('¿Estás seguro de que deseas finalizar esta solicitud?').then((result) => {
      if (result.isConfirmed) {
        this.requestService.finalizeRequest(requestId, this.adminNotes).subscribe({
          next: (response) => {
            this.sweetalertService.success('Solicitud finalizada con éxito');
            this.fetchActiveRequests();
          },
          error: (err) => {
            const errorMessage = err.error?.error || 'Error al finalizar la solicitud';
            if (errorMessage.includes('No hay un periodo académico activo')) {
              this.sweetalertService.error(
                'No hay un periodo académico activo. Por favor, configúrelo antes de continuar.'
              );
            } else {
              this.sweetalertService.error(errorMessage);
            }
          },
        });
      }
    });
  }

  // Cerrar modal de observación
  closeAdminNotesModal(): void {
    this.isAdminNotesModalOpen = false;
    this.adminNotes = '';
    this.currentRequestId = null;
    this.isRejectionAction = false;
  }

  // Guardar observación y continuar con la segunda alerta
  saveAdminNotes(): void {
    if (this.currentRequestId) {
      this.isAdminNotesModalOpen = false;
      
      if (this.isRejectionAction) {
        // Si es un rechazo, llamar al nuevo método
        this.confirmRejectRequest(this.currentRequestId);
      } else {
        // Lógica existente para finalizar o marcar como no devuelto
        const request = this.requests.find(r => r.requestId === this.currentRequestId);
        if (request?.status === 'prestamo') {
          this.confirmMarkAsNotReturned(this.currentRequestId);
        } else {
          this.confirmFinalizeRequest(this.currentRequestId);
        }
      }
    }
  }

  cancelRequest(id: number): void {
    this.sweetalertService.confirm('¿Estás seguro de que deseas cancelar esta solicitud?').then((result) => {
      if (result.isConfirmed) {
        this.requestService.deleteRequest(id).subscribe({
          next: () => {
            this.sweetalertService.success('Solicitud cancelada exitosamente.');
            this.fetchActiveRequests();
          },
          error: (error) => {
            const errorMessage = error.error?.error || 'Hubo un error al cancelar la solicitud.';
            if (errorMessage === 'No hay un periodo académico activo.') {
              this.sweetalertService.error(
                'No hay un periodo académico activo. Por favor, configúrelo antes de continuar.'
              );
            } else {
              this.sweetalertService.error(errorMessage);
            }
          }
        });
      }
    });
  }

  // Nuevo método para marcar como no devuelto
  markAsNotReturned(requestId: number): void {
    if (!requestId) {
      this.sweetalertService.error('ID de solicitud no válido');
      console.error('ID de solicitud no válido');
      return;
    }

    // Primera alerta: ¿Desea agregar una observación?
    this.sweetalertService.confirm('¿Desea agregar alguna observación?').then((result) => {
      if (result.isConfirmed) {
        // Abrir modal para capturar la observación
        this.currentRequestId = requestId;
        this.isAdminNotesModalOpen = true;
      } else {
        // Pasar directamente a la segunda alerta
        this.confirmMarkAsNotReturned(requestId);
      }
    });
  }

  // Confirmar marcar como no devuelto
  private confirmMarkAsNotReturned(requestId: number): void {
    this.sweetalertService.confirm('¿Estás seguro de que deseas marcar esta solicitud como no devuelta?').then((result) => {
      if (result.isConfirmed) {
        this.requestService.markAsNotReturned(requestId, this.adminNotes).subscribe({
          next: (response) => {
            this.sweetalertService.success('Solicitud marcada como no devuelta con éxito');
            this.fetchActiveRequests(); // Actualizar lista
          },
          error: (err) => {
            this.sweetalertService.error('Error al marcar la solicitud como no devuelta');
            console.error('Error al marcar la solicitud como no devuelta:', err);
          },
        });
      }
    });
  }

  private confirmRejectRequest(requestId: number): void {
    this.sweetalertService.confirm('¿Estás seguro de que deseas rechazar esta solicitud?').then((result) => {
      if (result.isConfirmed) {
        this.requestService.rejectRequest(requestId, this.adminNotes).subscribe({
          next: (response) => {
            this.sweetalertService.success('Solicitud rechazada con éxito');
            this.fetchActiveRequests();
          },
          error: (err) => {
            const errorMessage = err.error?.error || 'Error al rechazar la solicitud';
            if (errorMessage === 'No hay un periodo académico activo.') {
              this.sweetalertService.error(
                'No hay un periodo académico activo. Por favor, configúrelo antes de continuar.'
              );
            } else {
              this.sweetalertService.error(errorMessage);
            }
          }
        });
      }
      this.isRejectionAction = false;
      this.adminNotes = '';
    });
  }

  // Método helper para verificar si una solicitud puede marcarse como no devuelta
  canMarkAsNotReturned(request: any): boolean {
    return request.status === 'prestamo';
  }

  // Método helper para verificar si una solicitud puede finalizarse
  canFinalize(request: any): boolean {
    return ['prestamo', 'no_devuelto'].includes(request.status);
  }
  
}
