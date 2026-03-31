import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'builder',
    pathMatch: 'full'
  },
  {
    path: 'builder',
    loadComponent: () =>
      import('./components/canvas/canvas')
        .then(m => m.Canvas)
  },
  {
    path: 'view',
    loadComponent: () =>
      import('./components/dashboard-view/dashboard-view')
        .then(m => m.DashboardView)
  },
  {
    path: 'view/:id',
    loadComponent: () =>
      import('./components/dashboard-view/dashboard-view')
        .then(m => m.DashboardView)
  },
  {
    path: '**',
    redirectTo: 'builder'
  }
];