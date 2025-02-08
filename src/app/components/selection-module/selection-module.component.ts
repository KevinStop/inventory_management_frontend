// selection-module.component.ts
import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { UserService } from '../../services/user.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-selection-module',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="bg-gray-50 dark:bg-gray-900 min-h-screen flex items-center justify-center p-4">
      <div class="max-w-2xl w-full space-y-8 bg-white dark:bg-gray-800 p-8 rounded-xl shadow-lg">
        <div class="text-center">
          <h2 class="text-3xl font-bold text-gray-900 dark:text-white mb-4">
            Selecciona un módulo
          </h2>
          <p class="text-gray-600 dark:text-gray-400">
            Elige el sistema al que deseas acceder
          </p>
        </div>

        <div class="space-y-4">
          <button (click)="navigateToInventory()" 
                  class="w-full flex items-center justify-center px-6 py-4 text-lg font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition duration-150">
            <span>Sistema de Inventario</span>
          </button>

          <a href="http://localhost:4300/" 
             class="w-full flex items-center justify-center px-6 py-4 text-lg font-semibold text-blue-600 bg-white border-2 border-blue-600 rounded-lg hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition duration-150">
            <span>Sistema de Reserva de Laboratorios</span>
          </a>
        </div>
      </div>
    </div>
  `
})
export default class SelectionModuleComponent {
  constructor(
    private userService: UserService,
    private router: Router
  ) {}

  navigateToInventory(): void {
    this.userService.getUserDetails().subscribe({
      next: (user) => {
        if (user.role === 'admin') {
          this.router.navigate(['/home/electronicComponent']);
        } else {
          this.router.navigate(['/home/viewComponents']);
        }
      },
      error: (error) => {
        console.error('Error:', error);
        this.router.navigate(['/login']);
      }
    });
  }
}