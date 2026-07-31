import { Routes } from '@angular/router';
import {LoginComponent} from './login/login.component';
import {OrganogramaComponent} from './organograma/organograma.component';
import { authGuard } from './auth.guard';

export const routes: Routes = [
  {
    path: '',
   component:  LoginComponent,
   title: 'Login'},
  {
    path: 'dashboard',
    component: OrganogramaComponent,
    canActivate: [authGuard],
    title: 'Dashboard'}
];
