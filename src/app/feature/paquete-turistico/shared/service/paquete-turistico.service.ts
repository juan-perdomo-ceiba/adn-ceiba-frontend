import { Injectable } from '@angular/core';
import { HttpService } from '@core-service/http.service';
import { environment } from 'src/environments/environment';
import { PaqueteTuristico } from '../model/paquete-turistico';


@Injectable()
export class PaqueteTuristicoService {

  constructor(protected http: HttpService) {}

  public consultar() {
    return this.http.doGet<PaqueteTuristico[]>(`${environment.endpoint}/paquetes-turisticos`, this.http.optsName('consultar paquetes turisticos'));
  }

  public guardar(paqueteTuristico: PaqueteTuristico) {
    return this.http.doPost<PaqueteTuristico, boolean>(`${environment.endpoint}/paquetes-turisticos`, paqueteTuristico,
                                                this.http.optsName('crear/actualizar lugar turistico'));
  }

  public eliminar(paqueteTuristico: PaqueteTuristico) {
    return this.http.doDelete<boolean>(`${environment.endpoint}/paquetes-turisticos/${paqueteTuristico.id}`,
                                                 this.http.optsName('eliminar lugar turistico'));
  }

  public consultarPorId(id) {
    return this.http.doGet<PaqueteTuristico>(`${environment.endpoint}/paquetes-turisticos/${id}`, this.http.optsName('consultar paquete turistico'));
  }
}
