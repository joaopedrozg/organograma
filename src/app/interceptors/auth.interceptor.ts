import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthService } from '../auth.service';
import { catchError, throwError } from 'rxjs';
import { Router } from '@angular/router';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const router = inject(Router);
  const token = authService.getToken();
  const apiHosts = ['192.168.203.1:3000', 'localhost:3000', '127.0.0.1:3000'];

  // URL base da API para verificar se a requisição é interna
  // Cobrimos o host atual da API e os aliases locais ainda usados em desenvolvimento.
  // Também mantemos a verificação das rotas relativas da v1, que são as usadas pelos services.
  const isLocalApi = apiHosts.some((host) => req.url.includes(host)) ||
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
