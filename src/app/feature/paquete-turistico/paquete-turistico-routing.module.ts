import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { CrearPaqueteTuristicoComponent } from './components/crear-paquete-turistico/crear-paquete-turistico.component';
import { ListarPaqueteTuristicoComponent } from './components/listar-paquete-turistico/listar-paquete-turistico.component';
import { PaqueteTuristicoComponent } from './components/paquete-turistico/paquete-turistico.component';


const routes: Routes = [
  {
    path: '',
    component: PaqueteTuristicoComponent,
    children: [
      {
        path:'',
        redirectTo: 'listar',
        pathMatch: 'full' 
      },
      {
        path: 'crear',
        component: CrearPaqueteTuristicoComponent
      },
      {
        path: 'listar',
        component: ListarPaqueteTuristicoComponent
      }
    ]
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class PaqueteTuristicoRoutingModule { }
