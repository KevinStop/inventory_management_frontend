import { Component, OnInit } from '@angular/core';
import { RequestService } from '../../../services/request.service';
import { UserService } from '../../../services/user.service';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { initFlowbite } from 'flowbite';
import { Router } from '@angular/router';
import { SweetalertService } from '../../../components/alerts/sweet-alert.service';
import { TableModule } from 'primeng/table';
import { PaginatorModule } from 'primeng/paginator';

@Component({
  selector: 'app-request-view',
  standalone: true,
  imports: [FormsModule, CommonModule, TableModule, PaginatorModule],
  templateUrl: './request-view.component.html',
  styleUrls: ['./request-view.component.css'],
  
})
export default class RequestViewComponent implements OnInit {
  requests: any[] = [];
  filteredRequests: any[] = [];
  selectedStatus: string = 'pendiente';
  userId: number | undefined;
  isModalOpen: boolean = false;
  selectedDate: string | null = null;
  dateError: string | null = null;
  isDateValid: boolean = false;
  selectedRequest: any | null = null;
  requestInProgress: boolean = false;

  constructor(
    private requestService: RequestService,
    private userService: UserService,
    private router: Router,
    private sweetalertService: SweetalertService,

  ) {}

  ngOnInit(): void {
    initFlowbite();
    this.loadUserDetails(); 
  }

  loadUserDetails(): void {
    this.userService.getUserDetails().subscribe(
      (user) => {
        this.userId = user.userId;
        this.loadRequests(); // Cargar solicitudes después de obtener el userId
      },
      (error) => {
        console.error('Error al obtener los detalles del usuario:', error);
        this.sweetalertService.error('Error al obtener los detalles del usuario.');
        this.userId = undefined;
      }
    );
  }

  loadRequests(): void {
    if (!this.userId) {
      console.error('Usuario no autenticado.');
      this.sweetalertService.error('Usuario no autenticado.');
      return;
    }

    const filters = { status: this.selectedStatus, userId: this.userId };
    this.requestService.getRequestsByFilter(filters).subscribe(
      (response) => {
        this.requests = response;
        this.filterRequests();
      },
      (error) => {
        console.error('Error al cargar las solicitudes:', error);
        this.sweetalertService.error('Error al cargar las solicitudes.');
      }
    );
  }

  filterRequests(): void {
    this.filteredRequests = this.requests
      .filter((request) => request.status === this.selectedStatus)
      .map((request, index) => ({
        ...request,
        displayId: index + 1, // Enumerar las solicitudes filtradas
      }));
  }

  onStatusChange(event: Event): void {
    const selectElement = event.target as HTMLSelectElement;
    this.selectedStatus = selectElement.value;
    this.loadRequests(); // Volver a cargar solicitudes con el nuevo filtro
  }

  openModal(request: any): void {
    this.selectedRequest = request;
    this.isModalOpen = true;
  }

  closeModal(): void {
    this.isModalOpen = false;
    this.selectedDate = null;
    this.dateError = null;
    this.isDateValid = false;
    this.selectedRequest = null;
  }

  validateDate(): void {
    if (!this.selectedDate) {
      this.dateError = 'La fecha es requerida.';
      this.isDateValid = false;
      return;
    }

    const currentDate = new Date();
    const selectedDate = new Date(this.selectedDate);

    if (selectedDate < currentDate) {
      this.dateError = 'La fecha debe ser igual o mayor a la fecha actual.';
      this.isDateValid = false;
    } else {
      this.dateError = null;
      this.isDateValid = true;
    }
  }

  submitReturnDate(): void {
    if (!this.selectedRequest || !this.selectedDate) {
      this.sweetalertService.error('Debe seleccionar una solicitud y una fecha válida.');
      return;
    }
  
    this.requestInProgress = true;
  
    this.requestService.updateReturnDate(this.selectedRequest.requestId, this.selectedDate).subscribe({
      next: (response) => {
        this.sweetalertService.success('Fecha de retorno actualizada con éxito.');
        this.closeModal();
        this.loadRequests();
        this.requestInProgress = false;
      },
      error: (error) => {
        this.sweetalertService.error(error.error.error || 'Ocurrió un error al actualizar la fecha de retorno.');
        this.requestInProgress = false;
      }
    });
  }

  goToDetails(requestId: number): void {
    this.router.navigate([`/home/requestDetails`, requestId]);
  }
}