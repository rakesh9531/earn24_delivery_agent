import { Routes } from '@angular/router';
import { LoginComponent } from './components/login/login';
import { Dashboard } from './components/dashboard/dashboard';

import { History } from './components/history/history';
import { Earnings } from './components/earnings/earnings';
import { Profile } from './components/profile/profile';
import { InfoPage } from './components/info-page/info-page';

export const routes: Routes = [
  { path: 'login', component: LoginComponent },
  { path: 'dashboard', component: Dashboard },
  { path: 'history', component: History },
  { path: 'earnings', component: Earnings },
  { path: 'profile', component: Profile },
  { path: 'info/:key', component: InfoPage}, 
  { path: '', redirectTo: '/login', pathMatch: 'full' }, 
];