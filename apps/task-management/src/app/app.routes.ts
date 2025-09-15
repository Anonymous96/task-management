import { Route } from '@angular/router';
import { BaseLayout } from './layouts/base-layout/base-layout';
import { AuthenticationLayout } from './layouts/authentication-layout/authentication-layout';

export const appRoutes: Route[] = [
  // Authentication routes with lazy loading
  {
    path: 'auth',
    component: AuthenticationLayout,
    children: [
      {
        path: 'login',
        loadComponent: () => import('./pages/login/login').then((m) => m.Login),
        title: 'Login - Task Management',
      },
      { path: '', redirectTo: 'login', pathMatch: 'full' },
    ],
  },

  // Main application routes with lazy loading
  {
    path: '',
    component: BaseLayout,
    children: [
      { path: '', redirectTo: '/users', pathMatch: 'full' },

      // Users feature lazy loading
      {
        path: 'users',
        loadComponent: () => import('./pages/users/users').then((m) => m.Users),
        title: 'Users Management - Task Management',
      },

      // Tasks feature lazy loading
      {
        path: 'tasks',
        loadComponent: () => import('./pages/tasks/tasks').then((m) => m.Tasks),
        title: 'Tasks Management - Task Management',
      },
    ],
  },

  // 404 route with lazy loading
  {
    path: '404',
    loadComponent: () =>
      import('./pages/not-found/not-found').then((m) => m.NotFound),
    title: 'Page Not Found - Task Management',
  },

  // Wildcard route redirect to 404
  {
    path: '**',
    redirectTo: '/404',
  },
];
