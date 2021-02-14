import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { SecurityGuard } from '@core/guard/security.guard';
import { HomeComponent } from '@home/home.component';


const routes: Routes = [
  { path: '', redirectTo: '/home', pathMatch: 'full' },
  { path: 'home', component: HomeComponent, canActivate: [SecurityGuard]  },
  { path: 'lugar-turistico', loadChildren: () => import('@lugar-turistico/lugar-turistico.module').then(mod => mod.LugarTuristicoModule) },
  { path: 'paquete-turistico', loadChildren: () => import('@paquete-turistico/paquete-turistico.module').then(mod => mod.PaqueteTuristicoModule) },
  { path: 'reserva', loadChildren: () => import('@reserva/reserva.module').then(mod => mod.ReservaModule) },
  { path: 'login', loadChildren: () => import('@seguridad/seguridad.module').then(mod => mod.SeguridadModule)}
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
