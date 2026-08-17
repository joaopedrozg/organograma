import { Injectable, signal } from '@angular/core';
import { Observable, from, map, tap } from 'rxjs';
import { User } from '@supabase/supabase-js';
import { supabase } from './supabase/supabase.client';
import { environment } from '../environments/environment';

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
  access_token: string;
  token?: string;
  user: AuthUser;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly TOKEN_KEY = 'auth_token';
  private readonly USER_KEY = 'auth_user';
  private readonly inviteFunctionName = environment.supabase.inviteFunctionName;
  private readonly passwordSetupRedirectUrl = environment.supabase.passwordSetupRedirectUrl;
  private sessionReadyPromise: Promise<void>;

  // Signal inicializado buscando os dados salvos do sessionStorage para persistir o F5
  currentUser = signal<AuthUser | null>(this.getUserFromStorage());

  constructor() {
    this.sessionReadyPromise = this.hydrateSession();

    supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.access_token && session.user) {
        const user = this.mapSupabaseUser(session.user);
        this.persistAuth(session.access_token, user);
        return;
      }

      this.clearAuth();
    });
  }

  /**
   * Realiza o login no Supabase Auth e salva Token e Usuário no sessionStorage
   */
  login(credentials: LoginCredentials): Observable<AuthResponse> {
    return from(
      supabase.auth.signInWithPassword({
        email: credentials.email,
        password: credentials.password
      })
    ).pipe(
      map(({ data, error }) => {
        if (error) {
          throw error;
        }

        if (!data.session?.access_token || !data.user) {
          throw new Error('Resposta de login sem sessão válida.');
        }

        return {
          access_token: data.session.access_token,
          user: this.mapSupabaseUser(data.user)
        };
      }),
      tap((response) => {
        const token = response.access_token || response.token;
        if (!token) {
          throw new Error('Resposta de login sem token de acesso.');
        }

        this.persistAuth(token, response.user);
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
    return !!this.getToken() && !!this.currentUser();
  }

  async ensureSessionReady(): Promise<boolean> {
    await this.sessionReadyPromise;

    const { data, error } = await supabase.auth.getSession();
    if (error || !data.session?.access_token || !data.session.user) {
      this.clearAuth();
      return false;
    }

    this.persistAuth(data.session.access_token, this.mapSupabaseUser(data.session.user));
    return true;
  }

  /**
   * Faz o logout limpando a sessão e o Signal
   */
  logout(): void {
    void supabase.auth.signOut();
    this.clearAuth();
  }

  inviteFuncionarioUser(email: string, name: string, funcionarioId: string): Observable<void> {
    return from(this.inviteFuncionarioUserInternal(email, name, funcionarioId));
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

  private mapSupabaseUser(user: User): AuthUser {
    const metadataName =
      (typeof user.user_metadata?.['name'] === 'string' && user.user_metadata['name']) ||
      (typeof user.user_metadata?.['full_name'] === 'string' && user.user_metadata['full_name']) ||
      '';

    return {
      id: user.id,
      name: metadataName || user.email || 'Usuário',
      email: user.email || ''
    };
  }

  private persistAuth(token: string, user: AuthUser): void {
    sessionStorage.setItem(this.TOKEN_KEY, token);
    sessionStorage.setItem(this.USER_KEY, JSON.stringify(user));
    this.currentUser.set(user);
  }

  private clearAuth(): void {
    sessionStorage.removeItem(this.TOKEN_KEY);
    sessionStorage.removeItem(this.USER_KEY);
    this.currentUser.set(null);
  }

  private async hydrateSession(): Promise<void> {
    const { data, error } = await supabase.auth.getSession();
    if (error || !data.session?.access_token || !data.session.user) {
      return;
    }

    this.persistAuth(data.session.access_token, this.mapSupabaseUser(data.session.user));
  }

  private async inviteFuncionarioUserInternal(email: string, name: string, funcionarioId: string): Promise<void> {
    const { error } = await supabase.functions.invoke(this.inviteFunctionName, {
      body: {
        email,
        name,
        funcionarioId,
        redirectTo: this.passwordSetupRedirectUrl
      }
    });

    if (error) {
      throw error;
    }
  }
}
