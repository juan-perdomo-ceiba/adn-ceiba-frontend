import { NgModule } from '@angular/core';

import { LugarTuristicoRoutingModule } from './lugar-turistico-routing.module';
import { BorrarLugarTuristicoComponent } from './components/borrar-lugar-turistico/borrar-lugar-turistico.component';
import { ListarLugarTuristicoComponent } from './components/listar-lugar-turistico/listar-lugar-turistico.component';
import { CrearLugarTuristicoComponent } from './components/crear-lugar-turistico/crear-lugar-turistico.component';
import { LugarTuristicoComponent } from './components/lugar-turistico/lugar-turistico.component';
import { SharedModule } from '@shared/shared.module';
import { LugarTuristicoService } from './shared/service/lugar-turistico.service';


@NgModule({
  declarations: [
    CrearLugarTuristicoComponent,
    ListarLugarTuristicoComponent,
    BorrarLugarTuristicoComponent,
    LugarTuristicoComponent
  ],
  imports: [
    LugarTuristicoRoutingModule,
    SharedModule
  ],
  providers: [LugarTuristicoService]
})
export class LugarTuristicoModule { }
