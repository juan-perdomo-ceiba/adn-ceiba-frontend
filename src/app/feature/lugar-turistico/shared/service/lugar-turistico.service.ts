import { Injectable } from '@angular/core';
import { HttpService } from '@core-service/http.service';
import { environment } from 'src/environments/environment';
import { LugarTuristico } from '../model/lugar-turistico';


@Injectable()
export class LugarTuristicoService {

  constructor(protected http: HttpService) {}

  public consultar() {
    return this.http.doGet<LugarTuristico[]>(`${environment.endpoint}/lugar-turistico`, this.http.optsName('consultar lugares turisticos'));
  }

  public guardar(producto: LugarTuristico) {
    return this.http.doPost<LugarTuristico, boolean>(`${environment.endpoint}/lugar-turistico`, producto,
                                                this.http.optsName('crear/actualizar lugar turistico'));
  }

  public eliminar(producto: LugarTuristico) {
    return this.http.doDelete<boolean>(`${environment.endpoint}/lugar-turistico/${producto.id}`,
                                                 this.http.optsName('eliminar lugar turistico'));
  }
}
