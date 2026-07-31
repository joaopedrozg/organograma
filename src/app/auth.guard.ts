import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from './auth.service';

export const authGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  // Troque hasToken() por isAuthenticated()
  if (authService.isAuthenticated()) {
    return true; // Permite o acesso
  }

  // Se não estiver autenticado, redireciona para a página de login
  router.navigate(['/']);
  return false;
};
