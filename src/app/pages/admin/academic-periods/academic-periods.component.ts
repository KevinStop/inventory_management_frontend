import { Component, OnInit } from '@angular/core';
import { FormsModule, FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { AcademicPeriodsService } from '../../../services/academic-periods.service';
import { initFlowbite } from 'flowbite';
import { SweetalertService } from '../../../components/alerts/sweet-alert.service';

@Component({
  selector: 'app-academic-periods',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './academic-periods.component.html',
})
export default class AcademicPeriodsComponent implements OnInit {

  academicPeriods: any[] = [];
  activePeriod: any = null;
  inactivePeriods: any[] = [];
  isEdit: boolean = false;
  showInactiveTable: boolean = false;
  periodForm: FormGroup;

  constructor(
    private academicPeriodsService: AcademicPeriodsService,
    private fb: FormBuilder,
    private sweetalertService: SweetalertService
  ) {
    this.periodForm = this.fb.group(
      {
        name: ['', [Validators.required, Validators.minLength(3)]],
        startDate: ['', [Validators.required]],
        endDate: ['', [Validators.required]],
      },
      {
        validators: [this.dateRangeValidator],
      }
    );
  }

  ngOnInit(): void {
    initFlowbite();
    this.loadPeriods();
  }

  // Cargar períodos activos e inactivos
  loadPeriods(): void {
    this.academicPeriodsService.getAcademicPeriods().subscribe({
      next: (data) => {
        this.academicPeriods = data.academicPeriods;
        this.activePeriod = this.academicPeriods.find((p: any) => p.isActive) || null;
        this.inactivePeriods = this.academicPeriods.filter((p: any) => !p.isActive);
      },
      error: (err) => {
        console.error('Error al cargar los períodos:', err);
        this.sweetalertService.error('Error al cargar los períodos académicos.');
      },
    });
  }

  openCreateForm(): void {
    this.isEdit = false;
    this.showInactiveTable = false;
    this.periodForm.reset(); // Limpiar formulario
  }

  openEditForm(): void {
    this.isEdit = true;
    this.showInactiveTable = false;

    if (this.activePeriod) {
      this.periodForm.patchValue({
        name: this.activePeriod.name,
        startDate: new Date(this.activePeriod.startDate).toISOString().split('T')[0],
        endDate: new Date(this.activePeriod.endDate).toISOString().split('T')[0],
      });
    }
  }

  savePeriod(): void {
    if (this.periodForm.invalid) {
      this.sweetalertService.error('Por favor, completa todos los campos correctamente.');
      return;
    }

    const periodData = this.periodForm.value;

    if (this.isEdit) {
      // Actualizar período
      this.academicPeriodsService.updateAcademicPeriod(this.activePeriod.id, periodData).subscribe({
        next: () => {
          this.loadPeriods();
          this.sweetalertService.success('Período actualizado con éxito.');
        },
        error: (err) => {
          console.error('Error al actualizar el período:', err);
          this.sweetalertService.error('Error al actualizar el período académico.');
        },
      });
    } else {
      // Crear nuevo período
      this.academicPeriodsService.createAcademicPeriod(periodData).subscribe({
        next: (newPeriod) => {
          this.academicPeriodsService.activateAcademicPeriod(newPeriod.id).subscribe({
            next: () => {
              this.loadPeriods();
              this.sweetalertService.success('Nuevo período creado y activado con éxito.');
            },
            error: (err) => {
              console.error('Error al activar el período:', err);
              this.sweetalertService.error('Error al activar el nuevo período académico.');
            },
          });
        },
        error: (err) => {
          console.error('Error al crear el período:', err);
          this.sweetalertService.error('Error al crear el período académico.');
        },
      });
    }
  }

  toggleInactiveTable(): void {
    this.showInactiveTable = !this.showInactiveTable;

    if (this.showInactiveTable) {
      this.isEdit = false;
      this.periodForm.reset();
    }
  }

  // Activar un período inactivo
  activatePeriod(periodId: number): void {
    this.academicPeriodsService.activateAcademicPeriod(String(periodId)).subscribe({
      next: () => {
        this.loadPeriods();
        this.sweetalertService.success('Período activado con éxito.');
      },
      error: (err) => {
        console.error('Error al activar el período:', err);
        this.sweetalertService.error('Error al activar el período académico.');
      },
    });
  }

  dateRangeValidator(group: FormGroup): { [key: string]: any } | null {
    const startDate = new Date(group.get('startDate')?.value);
    const endDate = new Date(group.get('endDate')?.value);

    return endDate > startDate ? null : { dateRangeInvalid: true };
  }
}