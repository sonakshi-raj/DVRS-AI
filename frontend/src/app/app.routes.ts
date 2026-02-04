import { Routes } from '@angular/router';
import { Login } from './auth/login/login';
import { Register } from './auth/register/register';
import { Home } from './auth/home/home';
export const routes: Routes = [
    { path: "", redirectTo: "login", pathMatch: "full" },
    { path: "login", component: Login },
    { path: "register", component: Register },
    {
        path: 'home',
        loadComponent: () =>
            import('./auth/home/home').then(m => m.Home)
    },
    {
        path: 'interview',
        loadComponent: () =>
            import('./auth/interview/interview').then(m => m.Interview)
    },

    {
        path: 'dashboard',
        loadComponent: () =>
            import('./auth/dashboard/dashboard').then(m => m.Dashboard)
    },
    { path: "**", redirectTo: "login" }
];
