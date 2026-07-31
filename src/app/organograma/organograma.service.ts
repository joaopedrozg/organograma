import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { Funcionario } from '../models/models';
import { ApiService } from '../services/api.service';

@Injectable({
  providedIn: 'root'
})
export class OrganogramaService {
  private apiService = inject(ApiService);

  obterDados(): Observable<Funcionario[]> {
    return this.apiService.getFuncionarios();

  }
};
