import { Component, OnInit } from '@angular/core';
import { HeaderComponent } from '../header/header.component';
import { SidebarComponent } from '../sidebar/sidebar.component';
import { FooterComponent } from '../footer/footer.component';
import { RouterOutlet } from '@angular/router';
import { initFlowbite } from 'flowbite';

@Component({
  selector: 'app-layout',
  standalone: true,
  imports: [HeaderComponent, SidebarComponent, FooterComponent, RouterOutlet],
  templateUrl: './layout.component.html',
})
export default class LayoutComponent implements OnInit {

  constructor() { }

  ngOnInit(): void {
    initFlowbite();
  
    const themeToggleBtn = document.getElementById('theme-toggle');
    const themeToggleDarkIcon = document.getElementById('theme-toggle-dark-icon');
    const themeToggleLightIcon = document.getElementById('theme-toggle-light-icon');
  
    // Establecer tema claro por defecto si no existe en localStorage
    if (!localStorage.getItem('color-theme')) {
      localStorage.setItem('color-theme', 'light');
    }
  
    // Aplicar el tema almacenado
    if (localStorage.getItem('color-theme') === 'dark') {
      document.documentElement.classList.add('dark');
      themeToggleDarkIcon?.classList.remove('hidden');
      themeToggleLightIcon?.classList.add('hidden');
    } else {
      document.documentElement.classList.remove('dark');
      themeToggleLightIcon?.classList.remove('hidden');
      themeToggleDarkIcon?.classList.add('hidden');
    }
  
    themeToggleBtn?.addEventListener('click', () => {
      themeToggleDarkIcon?.classList.toggle('hidden');
      themeToggleLightIcon?.classList.toggle('hidden');
  
      if (localStorage.getItem('color-theme') === 'dark') {
        document.documentElement.classList.remove('dark');
        localStorage.setItem('color-theme', 'light');
      } else {
        document.documentElement.classList.add('dark');
        localStorage.setItem('color-theme', 'dark');
      }
    });
  }  

}