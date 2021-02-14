import { Injectable } from '@angular/core';
import { HttpService } from '@core-service/http.service';
import { environment } from 'src/environments/environment';
import { Autenticacion } from '../model/autenticacion';


@Injectable()
export class SeguridadService {

  constructor(protected http: HttpService) {}

  public login(autenticacion: Autenticacion) {
    return this.http.doPost<Autenticacion, Autenticacion>(`${environment.endpoint}/autenticacion`, autenticacion, this.http.optsName('login'));
  }

  public obtenerUsuario() {
    return JSON.parse(localStorage.getItem('sesion'));
  }

  public guardarSesion(response: Autenticacion) {
    localStorage.setItem('token', response.token);
    localStorage.setItem('sesion', JSON.stringify(response.usuario));
  }

  public cerrarSesion() {
    localStorage.removeItem('token');
    localStorage.removeItem('sesion');
  }
}
