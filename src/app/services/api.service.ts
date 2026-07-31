import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Cargo, Departamento, Funcionario } from '../models/models';

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  private http = inject(HttpClient);
  private readonly API_URL = '/api/v1';

  // Funcionários
  getFuncionarios(): Observable<Funcionario[]> {
    return this.http.get<Funcionario[]>(`${this.API_URL}/funcionario`);
  }

  createFuncionario(funcionario: Funcionario): Observable<Funcionario> {
    return this.http.post<Funcionario>(`${this.API_URL}/funcionario`, funcionario);
  }

  updateFuncionario(id: string, funcionario: Funcionario): Observable<Funcionario> {
    return this.http.patch<Funcionario>(`${this.API_URL}/funcionario/${id}`, funcionario);
  }

  deleteFuncionario(id: string): Observable<void> {
    return this.http.delete<void>(`${this.API_URL}/funcionario/${id}`);
  }

  // Cargos
  getCargos(): Observable<Cargo[]> {
    return this.http.get<Cargo[]>(`${this.API_URL}/cargo`);
  }

  createCargo(cargo: Cargo): Observable<Cargo> {
    return this.http.post<Cargo>(`${this.API_URL}/cargo`, cargo);
  }

  // Departamentos
  getDepartamentos(): Observable<Departamento[]> {
    return this.http.get<Departamento[]>(`${this.API_URL}/departamento`);
  }

  createDepartamento(depto: Departamento): Observable<Departamento> {
    return this.http.post<Departamento>(`${this.API_URL}/departamento`, depto);
  }
}
