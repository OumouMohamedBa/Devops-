import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'client',
    pathMatch: 'full'
  },
  {
    path: 'client',
    loadComponent: () => import('./client/client-dashboard/client-dashboard.component').then(m => m.ClientDashboardComponent)
  },
  {
    path: 'client/product/:id',
    loadComponent: () => import('./client/product-detail/product-detail.component').then(m => m.ProductDetailComponent)
  },
  {
    path: 'admin',
    loadComponent: () => import('./admin/admin-dashboard/admin-dashboard.component').then(m => m.AdminDashboardComponent)
  },
  {
    path: 'admin/infrastructure',
    loadComponent: () => import('./admin/infrastructure/infrastructure.component').then(m => m.InfrastructureComponent)
  },
  {
    path: 'admin/logs',
    loadComponent: () => import('./admin/logs/logs.component').then(m => m.LogsComponent)
  }
];
