import { Injectable } from '@angular/core';
import { HttpService } from '@core-service/http.service';
import { environment } from 'src/environments/environment';
import { LugarTuristico } from '../model/lugar-turistico';


@Injectable()
export class LugarTuristicoService {

  constructor(protected http: HttpService) {}

  public consultar() {
    return this.http.doGet<LugarTuristico[]>(`${environment.endpoint}/lugares-turisticos`, this.http.optsName('consultar lugares turisticos'));
  }

  public guardar(lugarTuristico: LugarTuristico) {
    return this.http.doPost<LugarTuristico, boolean>(`${environment.endpoint}/lugares-turisticos`, lugarTuristico,
                                                this.http.optsName('crear/actualizar lugar turistico'));
  }

  public eliminar(lugarTuristico: LugarTuristico) {
    return this.http.doDelete<boolean>(`${environment.endpoint}/lugares-turisticos/${lugarTuristico.id}`,
                                                 this.http.optsName('eliminar lugar turistico'));
  }
}
