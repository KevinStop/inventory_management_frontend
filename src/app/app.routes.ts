import { Routes } from '@angular/router';
import { AuthGuard } from './guards/auth.guard';
import { UnauthGuard } from './guards/unauth-guard.guard';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./pages/authentication/login/login.component'),
    canActivate: [UnauthGuard],
    pathMatch: 'full',
  },
  {
    path: 'register',
    loadComponent: () => import('./pages/authentication/register/register.component'),
    canActivate: [UnauthGuard],
  },
  {
    path: 'moduleSelection',
    loadComponent: () => import('./components/selection-module/selection-module.component'),
    canActivate: [AuthGuard],
  },
  {
    path: 'forgot-password',
    loadComponent: () => import('./pages/authentication/forgot-password/forgot-password.component'),
    canActivate: [UnauthGuard],
  },
  {
    path: 'home',
    loadComponent: () => import('./components/layout/layout.component'),
    children: [
      {
        path: 'componentMovement',
        loadComponent: () => import('./pages/admin/component-movement/component-movement.component'),
        canActivate: [AuthGuard],
        data: { role: 'admin' },
      },
      {
        path: 'electronicComponent',
        loadComponent: () => import('./pages/admin/electronic-component/electronic-component.component'),
        canActivate: [AuthGuard],
        data: { role: 'admin' },
      },
      {
        path: 'academicPeriods',
        loadComponent: () => import('./pages/admin/academic-periods/academic-periods.component'),
        canActivate: [AuthGuard],
        data: { role: 'admin' },
      },
      {
        path: 'request',
        loadComponent: () => import('./pages/admin/request/request.component'),
        canActivate: [AuthGuard],
        data: { role: 'admin' },
      },
      {
        path: 'loans',
        loadComponent: () => import('./pages/admin/loans/loans.component'),
        canActivate: [AuthGuard],
        data: { role: 'admin' },
      },
      {
        path: 'viewComponents',
        loadComponent: () => import('./pages/user/view-components/view-components.component'),
        canActivate: [AuthGuard],
        data: { role: 'user' },
      },
      {
        path: 'loansSummary',
        loadComponent: () => import('./pages/user/loans-summary/loans-summary.component'),
        canActivate: [AuthGuard],
        data: { role: 'user' },
      },
      {
        path: 'requestView',
        loadComponent: () => import('./pages/user/request-view/request-view.component'),
        canActivate: [AuthGuard],
        data: { role: 'user' },
      },
      {
        path: 'requestDetails/:id',
        loadComponent: () => import('./pages/user/request-details/request-details.component'),
        canActivate: [AuthGuard],
        data: { role: 'user' },
      },      
      {
        path: 'userProfile',
        loadComponent: () => import('./pages/authentication/user-profile/user-profile.component'),
        canActivate: [AuthGuard],
      },
      {
        path: '404',
        loadComponent: () => import('./components/page-not-found/page-not-found.component'),
        canActivate: [AuthGuard],
      },
      {
        path: '',
        redirectTo: '404',
        pathMatch: 'full',
      },
    ],
  },
  {
    path: '**',
    redirectTo: '',
  },
];