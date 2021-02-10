import { NgModule } from '@angular/core';

import { PaqueteTuristicoRoutingModule } from './paquete-turistico-routing.module';
import { ListarPaqueteTuristicoComponent } from './components/listar-paquete-turistico/listar-paquete-turistico.component';
import { CrearPaqueteTuristicoComponent } from './components/crear-paquete-turistico/crear-paquete-turistico.component';
import { PaqueteTuristicoComponent } from './components/paquete-turistico/paquete-turistico.component';
import { SharedModule } from '@shared/shared.module';
import { PaqueteTuristicoService } from './shared/service/paquete-turistico.service';


@NgModule({
  declarations: [
    CrearPaqueteTuristicoComponent,
    ListarPaqueteTuristicoComponent,
    PaqueteTuristicoComponent
  ],
  imports: [
    PaqueteTuristicoRoutingModule,
    SharedModule
  ],
  providers: [PaqueteTuristicoService]
})
export class PaqueteTuristicoModule { }
