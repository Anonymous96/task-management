import { Route } from '@angular/router';
import { Users } from './pages/users/users';
import { Tasks } from './pages/tasks/tasks';
import { Login } from './pages/login/login';
import { NotFound } from './pages/not-found/not-found';
import { BaseLayout } from './layouts/base-layout/base-layout';
import { AuthenticationLayout } from './layouts/authentication-layout/authentication-layout';

export const appRoutes: Route[] = [
  // {
  //   // Todo: Add logic if user guest redirect to login, otherwise redirect to users with can activate or can match (guard)
  //   // Todo: Lazy loading for routes
  //   path: '',
  //   component: AuthenticationLayout,
  //   children: [{ path: 'login', component: Login }],
  // },
  {
    path: '',
    component: BaseLayout,
    children: [
      { path: '', redirectTo: '/users', pathMatch: 'full' },
      { path: 'users', component: Users },
      { path: 'tasks', component: Tasks },
    ],
  },
  {
    path: '**',
    component: NotFound,
  },
];
