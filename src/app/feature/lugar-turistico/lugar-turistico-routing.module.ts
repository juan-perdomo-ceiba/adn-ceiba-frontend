import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { CrearLugarTuristicoComponent } from './components/crear-lugar-turistico/crear-lugar-turistico.component';
import { ListarLugarTuristicoComponent } from './components/listar-lugar-turistico/listar-lugar-turistico.component';
import { BorrarLugarTuristicoComponent } from './components/borrar-lugar-turistico/borrar-lugar-turistico.component';
import { LugarTuristicoComponent } from './components/lugar-turistico/lugar-turistico.component';


const routes: Routes = [
  {
    path: '',
    component: LugarTuristicoComponent,
    children: [
      {
        path:'',
        redirectTo: 'listar',
        pathMatch: 'full' 
      },
      {
        path: 'crear',
        component: CrearLugarTuristicoComponent
      },
      {
        path: 'listar',
        component: ListarLugarTuristicoComponent
      },
      {
        path: 'borrar',
        component: BorrarLugarTuristicoComponent
      },
      {
        path: 'editar/:id',
        component: CrearLugarTuristicoComponent
      }
    ]
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class LugarTuristicoRoutingModule { }
