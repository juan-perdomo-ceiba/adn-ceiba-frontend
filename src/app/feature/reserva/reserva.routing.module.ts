import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { ConsultarReservaComponent } from './components/consultar-reserva/consultar-reserva.component';
import { CrearReservaComponent } from './components/crear-reserva/crear-reserva.component';
import { ListarReservaComponent } from './components/listar-reserva/listar-reserva.component';
import { ReservaComponent } from './components/reserva/reserva.component';


const routes: Routes = [
  {
    path: '',
    component: ReservaComponent,
    children: [
      {
        path:'',
        redirectTo: 'listar',
        pathMatch: 'full' 
      },
      {
        path: ':id/crear',
        component: CrearReservaComponent
      },
      {
        path: 'listar',
        component: ListarReservaComponent
      },
      {
        path: 'consultar',
        component: ConsultarReservaComponent
      }
    ]
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class ReservaRoutingModule { }
