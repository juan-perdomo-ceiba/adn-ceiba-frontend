import { NgModule } from '@angular/core';

import { SharedModule } from '@shared/shared.module';
import { ReservaService } from './shared/service/reserva.service';
import { CrearReservaComponent } from './components/crear-reserva/crear-reserva.component';
import { ListarReservaComponent } from './components/listar-reserva/listar-reserva.component';
import { ReservaComponent } from './components/reserva/reserva.component';
import { ReservaRoutingModule } from './reserva.routing.module';
import { DetalleReservaComponent } from './components/detalle-reserva/detalle-reserva.component';
import { ConsultarReservaComponent } from './components/consultar-reserva/consultar-reserva.component';

@NgModule({
  declarations: [
    CrearReservaComponent,
    ListarReservaComponent,
    ReservaComponent,
    DetalleReservaComponent,
    ConsultarReservaComponent
  ],
  imports: [
    ReservaRoutingModule,
    SharedModule
  ],
  providers: [ReservaService]
})
export class ReservaModule { }
