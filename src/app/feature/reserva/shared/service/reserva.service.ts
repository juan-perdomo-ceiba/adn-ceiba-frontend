import { Injectable } from '@angular/core';
import { HttpService } from '@core-service/http.service';
import { environment } from 'src/environments/environment';
import { Reserva } from '../model/reserva';


@Injectable()
export class ReservaService {

  constructor(protected http: HttpService) {}

  public consultar() {
    return this.http.doGet<Reserva[]>(`${environment.endpoint}/reservas`, this.http.optsName('consultar reservas'));
  }

  public guardar(paqueteTuristico: Reserva) {
    return this.http.doPost<Reserva, boolean>(`${environment.endpoint}/reservas`, paqueteTuristico,
                                                this.http.optsName('crear/actualizar reserva'));
  }

  public consultarPorId(id) {
    return this.http.doGet<Reserva>(`${environment.endpoint}/reservas/${id}`, this.http.optsName('consultar reserva'));
  }

  public consultarPorIdentificador(identificador) {
    return this.http.doGet<Reserva>(`${environment.endpoint}/reservas/detalle/${identificador}`, this.http.optsName('consultar reserva por identificador'));
  }
}
