import { Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import {OrganogramaComponent} from './organograma/organograma.component';
import {LoginComponent} from './login/login.component';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, OrganogramaComponent, LoginComponent],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  protected readonly title = signal('organograma');
}
