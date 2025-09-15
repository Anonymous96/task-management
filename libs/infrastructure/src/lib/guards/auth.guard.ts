import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';

export const AuthGuard: CanActivateFn = (route, state) => {
  const router = inject(Router);

  const isAuthenticated = isUserAuthenticated();

  if (!isAuthenticated) {
    console.log('User not authenticated, redirecting to login');
    router.navigate(['/login'], {
      queryParams: { returnUrl: state.url },
    });
    return false;
  }

  return true;
};

export function isUserAuthenticated(): boolean {
  const authToken = sessionStorage.getItem('auth_token');
  return !!authToken;
}

export function login(username: string, password: string): boolean {
  const validCredentials = [{ username: 'admin', password: 'admin' }];

  const isValid = validCredentials.some(
    (cred) => cred.username === username && cred.password === password
  );

  if (isValid) {
    sessionStorage.setItem('auth_token', 'authenticated');
    sessionStorage.setItem(
      'current_user',
      JSON.stringify({
        username: username,
        loginTime: new Date().toISOString(),
      })
    );
    return true;
  }
  return false;
}

export function logout(): void {
  sessionStorage.removeItem('auth_token');
  sessionStorage.removeItem('current_user');
}

export function getCurrentUser(): {
  username: string;
  loginTime: string;
} | null {
  try {
    const userStr = sessionStorage.getItem('current_user');
    return userStr ? JSON.parse(userStr) : null;
  } catch {
    return null;
  }
}
