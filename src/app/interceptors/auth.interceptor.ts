import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthService } from '../auth.service';
import { catchError, throwError } from 'rxjs';
import { Router } from '@angular/router';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const router = inject(Router);
  const token = authService.getToken();

  // URL base da API para verificar se a requisição é interna
  // Verificamos localhost:3000 para cobrir tanto com /api/v1 quanto sem
  // Também adicionamos :3000 para garantir que pegamos a porta correta
  // Adicionamos verificação para as rotas específicas da v1
  const isLocalApi = req.url.includes('localhost:3000') ||
                     req.url.includes('127.0.0.1:3000') ||
                     req.url.startsWith('http://localhost:3000') ||
                     req.url.includes('/api/v1/');

  // Ignorar chamadas de login para evitar loop ou erros desnecessários,
  // embora o token geralmente seja nulo no login
  const isLoginRequest = req.url.includes('/auth/login');

  console.log(`[AuthInterceptor] Request to: ${req.url} | isLocalApi: ${isLocalApi} | hasToken: ${!!token}`);

  let request = req;

  if (token && isLocalApi && !isLoginRequest) {
    console.log(`[AuthInterceptor] Attaching token to: ${req.url}`);
    request = req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`
      }
    });
  }

  return next(request).pipe(
    catchError((error: HttpErrorResponse) => {
      if (error.status === 401 && isLocalApi && !isLoginRequest) {
        console.error('[AuthInterceptor] 401 Unauthorized detected. Clearing session and redirecting to login.');
        authService.logout();
        router.navigate(['/']);
      }
      return throwError(() => error);
    })
  );
};
