import { HttpClient } from '@angular/common/http';
import { Service, inject } from '@angular/core';
import { Observable } from 'rxjs';

@Service()
export class OrganogramaService {
  private http = inject(HttpClient);

  // URL Raw do seu JSON público
  private apiUrl = 'https://raw.githubusercontent.com/joaopedrozg/dados-users-ficticios/refs/heads/main/users2.json';

  obterDados(): Observable<any> {
    return this.http.get<any>(this.apiUrl);

  }
};
