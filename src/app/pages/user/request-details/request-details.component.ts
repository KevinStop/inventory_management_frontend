import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { RequestService } from '../../../services/request.service';
import { SweetalertService } from '../../../components/alerts/sweet-alert.service';
import { environment } from '../../../../environments/environment';

@Component({
  selector: 'app-request-details',
  standalone: true,
  imports: [FormsModule, CommonModule],
  templateUrl: './request-details.component.html',
})
export default class RequestDetailsComponent implements OnInit {

  public apiUrl = environment.apiUrl;

  requestDetails: any | null = null;

  constructor(
    private route: ActivatedRoute,
    private requestService: RequestService,
    private router: Router,
    private sweetalertService: SweetalertService
  ) {}

  ngOnInit(): void {
    const requestId = this.route.snapshot.paramMap.get('id');
    if (requestId) {
      this.loadRequestDetails(+requestId);
    }
  }

  loadRequestDetails(id: number): void {
    this.requestService.getRequestById(id).subscribe(
      (response) => {
        this.requestDetails = response;
      },
      (error) => {
        console.error('Error al cargar los detalles de la solicitud:', error);
        this.sweetalertService.error('Error al cargar los detalles de la solicitud.');
      }
    );
  }

  cancelRequest(id: number): void {
    this.sweetalertService.confirm('¿Estás seguro de que deseas cancelar esta solicitud?').then((result) => {
      if (result.isConfirmed) {
        this.requestService.deleteRequest(id).subscribe(
          () => {
            this.sweetalertService.success('Solicitud cancelada exitosamente.');
            this.router.navigate(['/home/viewComponents']);
          },
          (error) => {
            console.error('Error al cancelar la solicitud:', error);
            this.sweetalertService.error('Hubo un error al cancelar la solicitud. Intente nuevamente.');
          }
        );
      }
    });
  }

  goBack(): void {
    this.router.navigate(['/home/requestView']);
  }
}
