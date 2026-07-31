import { Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import {OrganogramaComponent} from './organograma/organograma.component';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, OrganogramaComponent],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  protected readonly title = signal('organograma');
}
