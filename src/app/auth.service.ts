import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';

// Interfaces de Tipo para Autenticação
export interface LoginCredentials {
  email: string;
  password: string;
}

export interface AuthUser {
  id: string;
  name: string;
  email: string;
}

export interface AuthResponse {
  token: string;
  user: AuthUser;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private http = inject(HttpClient);

  // Altere para a URL base da sua API
  private readonly API_URL = 'http://localhost:3000';
  private readonly TOKEN_KEY = 'auth_token';
  private readonly USER_KEY = 'auth_user';

  // Signal inicializado buscando os dados salvos do sessionStorage para persistir o F5
  currentUser = signal<AuthUser | null>(this.getUserFromStorage());

  /**
   * Realiza o login na API e salva o Token e Usuário no sessionStorage
   */
  login(credentials: LoginCredentials): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.API_URL}/auth/login`, credentials).pipe(
      tap((response) => {
        // Salva o token JWT e os dados do usuário no sessionStorage
        sessionStorage.setItem(this.TOKEN_KEY, response.token);
        sessionStorage.setItem(this.USER_KEY, JSON.stringify(response.user));

        // Atualiza o Signal reativo com os dados do usuário
        this.currentUser.set(response.user);
      })
    );
  }

  /**
   * Recupera o token salvo no sessionStorage
   */
  getToken(): string | null {
    return sessionStorage.getItem(this.TOKEN_KEY);
  }

  /**
   * Verifica se há um usuário logado
   */
  isAuthenticated(): boolean {
    return !!this.getToken();
  }

  /**
   * Faz o logout limpando a sessão e o Signal
   */
  logout(): void {
    sessionStorage.removeItem(this.TOKEN_KEY);
    sessionStorage.removeItem(this.USER_KEY);
    this.currentUser.set(null);
  }

  /**
   * Função auxiliar privada para recuperar dados do usuário após um F5
   */
  private getUserFromStorage(): AuthUser | null {
    const userJson = sessionStorage.getItem(this.USER_KEY);
    if (!userJson) return null;
    try {
      return JSON.parse(userJson) as AuthUser;
    } catch {
      return null;
    }
  }
}
