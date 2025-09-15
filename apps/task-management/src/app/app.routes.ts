import { Route } from '@angular/router';
import { BaseLayout } from './layouts/base-layout/base-layout';
import { AuthenticationLayout } from './layouts/authentication-layout/authentication-layout';
import { AuthGuard } from '@loginsvi/infrastructure';

export const appRoutes: Route[] = [
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

  {
    path: '',
    component: BaseLayout,
    canActivate: [AuthGuard],
    children: [
      { path: '', redirectTo: '/users', pathMatch: 'full' },

      {
        path: 'users',
        loadComponent: () => import('./pages/users/users').then((m) => m.Users),
        title: 'Users Management - Task Management',
      },

      {
        path: 'tasks',
        loadComponent: () => import('./pages/tasks/tasks').then((m) => m.Tasks),
        title: 'Tasks Management - Task Management',
      },
    ],
  },

  {
    path: 'login',
    redirectTo: '/auth/login',
    pathMatch: 'full',
  },

  {
    path: '404',
    loadComponent: () =>
      import('./pages/not-found/not-found').then((m) => m.NotFound),
    title: 'Page Not Found - Task Management',
  },

  {
    path: '**',
    redirectTo: '/404',
  },
];
