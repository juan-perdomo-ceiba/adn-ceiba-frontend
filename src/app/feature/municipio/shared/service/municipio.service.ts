import { Injectable } from '@angular/core';
import { HttpService } from '@core-service/http.service';
import { environment } from 'src/environments/environment';
import { Municipio } from '../model/municipio';


@Injectable()
export class MunicipioService {

  constructor(protected http: HttpService) {}

  public consultar() {
    return this.http.doGet<Municipio[]>(`${environment.endpoint}/municipios`, this.http.optsName('consultar municipios'));
  }
}
